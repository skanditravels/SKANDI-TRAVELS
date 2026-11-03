
    const STATE = {
      zoomLevel: 7.5,
      currentDateOffset: 0, // days from start
      rosterCollapsed: false,
      filtersCollapsed: false,
      editMode: false,
      markTitles: false,
      selectedCrewId: null,
      selectedActId: null,
      initialized: false,
      loading: true,
      bootstrapRequestAt: 0,
      lastSyncAt: null,
      windowStart: new Date().toISOString(),
      currentUser: {},
      bases: [],
      roles: [],
      openTime: [],
      pendingActions: new Map(),
      filters: { 
        search: '', 
        base: [],
        role: [], 
        compliance: ['Legal', 'Warning', 'Violation'],
        activities: ['flight', 'duty', 'sby', 'rest', 'vacation', 'disrupted'] 
      },
      
      auditLog: [],

      crewData: [],

      vacations: [],
      myRosterRequests: [],
      trades: [],
      logistics: [],
      messages: [],
      jurisdictions: {}
    };

    const OPS_SOURCE = 'SKANDI_OPS_CONTROL';
    const OPS_PARENT = 'SKANDI_WIX_PARENT';

    const asArray = value => Array.isArray(value) ? value : [];
    const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const idOf = value => String(value ?? '').trim();
    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));

    function postToWix(type, payload = {}) {
      window.parent.postMessage({ source: OPS_SOURCE, type, payload }, '*');
    }

    function applyMasterConfig(config) {
      const logo = document.getElementById('masterAlteaLogo');
      if (!logo) return;
      logo.removeAttribute('src');
      logo.dataset.masterLogo = '[LEAVE_PLACEHOLDER]';
      logo.hidden = true;
    }

    function setSyncState(label, status = '') {
      const element = document.getElementById('syncState');
      if (!element) return;
      element.textContent = label;
      element.className = `sync-state ${status}`.trim();
    }

    function requestBootstrap(reason = 'INITIAL_LOAD') {
      STATE.loading = true;
      const requestedAt = Date.now();
      STATE.bootstrapRequestAt = requestedAt;
      setSyncState('Syncing');
      postToWix('OPS_BOOTSTRAP_REQUEST', {
        reason,
        windowStart: STATE.windowStart,
        dateOffset: STATE.currentDateOffset
      });
      window.setTimeout(() => {
        if (!STATE.loading || STATE.bootstrapRequestAt !== requestedAt) return;
        setSyncState('Offline', 'error');
        showToast('OPS data did not arrive from the Wix page bridge.', 'error');
      }, 15000);
    }

    function dispatchAction(action, payload = {}, successMessage = '') {
      const requestId = `OPS-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      STATE.pendingActions.set(requestId, { action, successMessage });
      setSyncState('Saving');
      postToWix('OPS_ACTION', { requestId, action, payload });
      window.setTimeout(() => {
        if (!STATE.pendingActions.has(requestId)) return;
        STATE.pendingActions.delete(requestId);
        setSyncState('Error', 'error');
        showToast('OPS did not confirm the change. Refresh before retrying.', 'error');
      }, 20000);
      return requestId;
    }

    function hoursFromWindow(value) {
      if (Number.isFinite(Number(value))) return Number(value);
      const timestamp = Date.parse(value);
      const windowStart = Date.parse(STATE.windowStart);
      return Number.isFinite(timestamp) && Number.isFinite(windowStart) ? (timestamp - windowStart) / 3600000 : 0;
    }

    function normalizeActivity(row) {
      const startH = hoursFromWindow(row.startH ?? row.start_h ?? row.startAt ?? row.start_at);
      const explicitDuration = Number(row.durH ?? row.durationHours ?? row.duration_hours);
      const endH = hoursFromWindow(row.endAt ?? row.end_at);
      return {
        id: idOf(row.id ?? row.assignmentId ?? row.assignment_id),
        sourceId: idOf(row.sourceId ?? row.source_id ?? row.id ?? row.assignmentId ?? row.assignment_id),
        sourceTable: String(row.sourceTable ?? row.source_table ?? ''),
        type: String(row.type ?? row.activityType ?? row.activity_type ?? 'duty').toLowerCase(),
        label: String(row.label ?? row.reference ?? row.title ?? ''),
        startH,
        durH: Number.isFinite(explicitDuration) ? explicitDuration : Math.max(0.25, endH - startH),
        status: String(row.status ?? 'PENDING').toUpperCase(),
        isCalloutCandidate: Boolean(row.isCalloutCandidate ?? row.is_callout_candidate)
      };
    }

    function normalizeCrew(row, assignments) {
      const agentId = idOf(row.agentId ?? row.agent_id ?? row.skId ?? row.sk_id ?? row.id);
      const staffAssignments = assignments.filter(item =>
        idOf(item.agentId ?? item.agent_id ?? item.skId ?? item.sk_id ?? item.staffId ?? item.staff_id) === agentId
      );
      const activities = asArray(row.acts ?? row.activities ?? row.assignments).concat(staffAssignments).map(normalizeActivity);
      const primaryActivity = activities.find(item => !['COMPLETED', 'CANCELED'].includes(item.status)) ?? activities[0];
      return {
        id: agentId,
        agentId,
        name: String(row.name ?? row.fullName ?? row.full_name ?? [row.firstName ?? row.first_name, row.lastName ?? row.last_name].filter(Boolean).join(' ') ?? ''),
        assigned: String(row.assigned ?? row.currentAssignment ?? row.current_assignment ?? primaryActivity?.label ?? '—'),
        base: String(row.baseCode ?? row.base_code ?? row.base ?? row.seeuor ?? '—'),
        badge: String(row.badge ?? 'gray'),
        role: String(row.roleName ?? row.role_name ?? row.role ?? '—'),
        alert: String(row.alert ?? ''),
        checkin: String(row.checkin ?? row.checkInStatus ?? row.check_in_status ?? 'gray'),
        acts: activities,
        ftl: {
          d7: Number(row.ftl?.d7 ?? row.hours7Days ?? row.hours_7_days ?? 0),
          f28: Number(row.ftl?.f28 ?? row.hours28Days ?? row.hours_28_days ?? 0),
          f365: Number(row.ftl?.f365 ?? row.hours365Days ?? row.hours_365_days ?? 0)
        }
      };
    }

    function normalizeVacation(row) {
      const start = row.startDate ?? row.start_date ?? '';
      const end = row.endDate ?? row.end_date ?? '';
      const startMs = Date.parse(start);
      const endMs = Date.parse(end);
      const calculatedDays = Number.isFinite(startMs) && Number.isFinite(endMs)
        ? Math.floor((endMs - startMs) / 86400000) + 1
        : 0;
      return {
        id: idOf(row.id ?? row.requestId ?? row.request_id),
        sourceId: idOf(row.sourceId ?? row.source_id ?? row.id),
        staffId: idOf(row.agentId ?? row.agent_id ?? row.staffId ?? row.staff_id),
        name: String(row.name ?? row.staffName ?? row.staff_name ?? ''),
        base: String(row.baseCode ?? row.base_code ?? row.base ?? ''),
        period: String(row.period ?? [start, end].filter(Boolean).join(' to ')),
        days: Number(row.days ?? row.durationDays ?? row.duration_days ?? calculatedDays),
        status: String(row.status ?? 'PENDING REVIEW').toUpperCase().replaceAll('_', ' ')
      };
    }

    function normalizeMyRosterRequest(row) {
      return {
        id: idOf(row.id ?? row.requestId ?? row.request_id),
        sourceId: idOf(row.sourceId ?? row.source_id ?? row.id),
        employeeId: idOf(row.employeeId ?? row.employee_id),
        name: String(row.name ?? row.staffName ?? row.staff_name ?? ''),
        base: String(row.base ?? row.baseCode ?? row.base_code ?? ''),
        type: String(row.type ?? row.requestType ?? row.request_type ?? 'STAFF REQUEST').toUpperCase().replaceAll('_', ' '),
        period: String(row.period ?? ''),
        summary: String(row.summary ?? row.details ?? row.notes ?? ''),
        status: String(row.status ?? 'PENDING').toUpperCase().replaceAll('_', ' '),
        submittedAt: String(row.submittedAt ?? row.createdAt ?? row.created_at ?? '')
      };
    }

    function normalizeTrade(row) {
      return {
        id: idOf(row.id ?? row.tradeId ?? row.trade_id),
        sourceId: idOf(row.sourceId ?? row.source_id ?? row.id),
        crewA: String(row.crewA ?? row.staffAName ?? row.staff_a_name ?? row.requesterName ?? row.requester_name ?? ''),
        crewB: String(row.crewB ?? row.staffBName ?? row.staff_b_name ?? row.counterpartyName ?? row.counterparty_name ?? ''),
        details: String(row.details ?? row.exchangeDetails ?? row.exchange_details ?? ''),
        status: String(row.status ?? 'PENDING').toUpperCase()
      };
    }

    function normalizeLogistics(row) {
      return {
        id: idOf(row.id ?? row.logisticsId ?? row.logistics_id ?? row.reference),
        name: String(row.name ?? row.staffName ?? row.staff_name ?? ''),
        loc: String(row.loc ?? row.location ?? ''),
        supplier: String(row.supplier ?? row.supplierName ?? row.supplier_name ?? ''),
        dates: String(row.dates ?? row.serviceDates ?? row.service_dates ?? ''),
        status: String(row.status ?? 'PENDING').toUpperCase()
      };
    }

    function normalizeMessage(row) {
      return {
        id: idOf(row.id ?? row.messageId ?? row.message_id),
        time: String(row.time ?? row.sentAt ?? row.sent_at ?? ''),
        recipient: String(row.recipient ?? row.recipientName ?? row.recipient_name ?? ''),
        channel: String(row.channel ?? ''),
        subject: String(row.subject ?? ''),
        status: String(row.status ?? row.deliveryStatus ?? row.delivery_status ?? 'PENDING').toUpperCase(),
        read: String(row.read ?? row.readStatus ?? row.read_status ?? 'UNREAD').toUpperCase()
      };
    }

    function normalizeAudit(row) {
      return {
        id: idOf(row.id ?? row.auditId ?? row.audit_id),
        time: String(row.time ?? row.createdAt ?? row.created_at ?? ''),
        action: String(row.action ?? row.eventType ?? row.event_type ?? ''),
        details: String(row.details ?? row.description ?? ''),
        status: String(row.status ?? 'SUCCESS').toUpperCase()
      };
    }

    function normalizeJurisdictions(value) {
      if (!Array.isArray(value)) return asObject(value);
      return value.reduce((result, row) => {
        const code = idOf(row.baseCode ?? row.base_code ?? row.code ?? row.id);
        if (!code) return result;
        result[code] = {
          name: String(row.name ?? row.title ?? code),
          maxDuty7: Number(row.maxDuty7 ?? row.max_duty_7 ?? row.maxHours7Days ?? row.max_hours_7_days ?? 0),
          maxFlight28: Number(row.maxFlight28 ?? row.max_flight_28 ?? row.maxHours28Days ?? row.max_hours_28_days ?? 0),
          maxFlight365: Number(row.maxFlight365 ?? row.max_flight_365 ?? row.maxHours365Days ?? row.max_hours_365_days ?? 0),
          minRest: Number(row.minRest ?? row.min_rest ?? row.minimumRestHours ?? row.minimum_rest_hours ?? 0),
          annualVacation: Number(row.annualVacation ?? row.annual_vacation ?? row.annualVacationDays ?? row.annual_vacation_days ?? 0)
        };
        return result;
      }, {});
    }

    function applyBootstrap(rawPayload) {
      const payload = asObject(rawPayload?.bootstrap ?? rawPayload?.data ?? rawPayload);
      const assignments = asArray(payload.assignments);
      const staff = asArray(payload.staff ?? payload.crewData ?? payload.employees);
      STATE.windowStart = payload.windowStart ?? payload.window_start ?? payload.window?.startAt ?? STATE.windowStart;
      STATE.crewData = staff.map(row => normalizeCrew(asObject(row), assignments));
      STATE.vacations = asArray(payload.vacations ?? payload.vacationRequests).map(row => normalizeVacation(asObject(row)));
      STATE.myRosterRequests = asArray(payload.myRosterRequests).map(row => normalizeMyRosterRequest(asObject(row)));
      STATE.trades = asArray(payload.tripTrades ?? payload.trades).map(row => normalizeTrade(asObject(row)));
      STATE.logistics = asArray(payload.logistics).map(row => normalizeLogistics(asObject(row)));
      STATE.messages = asArray(payload.messages).map(row => normalizeMessage(asObject(row)));
      STATE.auditLog = asArray(payload.auditLog ?? payload.audit).map(row => normalizeAudit(asObject(row)));
      STATE.openTime = asArray(payload.openTime ?? payload.open_time);
      STATE.currentUser = asObject(payload.currentUser ?? payload.user ?? payload.profile);
      STATE.jurisdiction = String(payload.jurisdiction ?? STATE.jurisdiction ?? '');
      STATE.bases = asArray(payload.bases);
      STATE.roles = asArray(payload.roles);
      STATE.jurisdictions = normalizeJurisdictions(payload.jurisdictions);
      STATE.lastSyncAt = payload.syncedAt ?? payload.synced_at ?? new Date().toISOString();
      STATE.loading = false;
      STATE.initialized = true;
      hydrateFilters();
      hydrateProfile();
      renderApp();
      setSyncState('Live', 'ready');
      sendHeight();
    }

    function hydrateFilters() {
      const baseCodes = STATE.bases.length
        ? STATE.bases.map(base => idOf(base.code ?? base.baseCode ?? base.base_code ?? base.id)).filter(Boolean)
        : [...new Set(STATE.crewData.map(crew => crew.base).filter(Boolean))];
      const roles = STATE.roles.length
        ? STATE.roles.map(role => String(role.name ?? role.roleName ?? role.role_name ?? role.code ?? role.id ?? '')).filter(Boolean)
        : [...new Set(STATE.crewData.map(crew => crew.role).filter(Boolean))];
      STATE.filters.base = baseCodes;
      STATE.filters.role = roles;
      const baseContainer = document.getElementById('baseFilterContent');
      const roleContainer = document.getElementById('roleFilterContent');
      if (baseContainer) baseContainer.innerHTML = baseCodes.length
        ? baseCodes.map(code => `<label class="checkbox-row"><input type="checkbox" value="${escapeHtml(code)}" class="filter-base" checked onchange="handleFilterChange()"> <span>${escapeHtml(code)}</span></label>`).join('')
        : '<div class="empty-state">No bases available</div>';
      if (roleContainer) roleContainer.innerHTML = roles.length
        ? roles.map(role => `<label class="checkbox-row"><input type="checkbox" value="${escapeHtml(role)}" class="filter-role" checked onchange="handleFilterChange()"> <span>${escapeHtml(role)}</span></label>`).join('')
        : '<div class="empty-state">No roles available</div>';
    }

    function hydrateProfile() {
      const user = STATE.currentUser;
      const setValue = (id, value) => { const element = document.getElementById(id); if (element) element.value = value ?? ''; };
      setValue('profileAgentId', user.agentId ?? user.agent_id ?? user.skId ?? user.sk_id);
      setValue('profileFullName', user.fullName ?? user.full_name ?? user.name);
      setValue('profileRole', user.roleName ?? user.role_name ?? user.role);
      setValue('profileEmail', user.email);
      const settings = asObject(user.settings ?? STATE.settings);
      if (settings.theme === 'light') document.body.classList.add('theme-high-contrast');
      else document.body.classList.remove('theme-high-contrast');
    }

    window.addEventListener('message', event => {
      if (event.source !== window.parent) return;
      const message = asObject(event.data);
      if (message.source && message.source !== OPS_PARENT) return;
      if (message.type === 'SKANDI_MASTER_CONFIG') {
        applyMasterConfig(message.payload);
        return;
      }
      if (message.type === 'OPS_BOOTSTRAP' || message.type === 'OPS_STATE') {
        applyBootstrap(message.payload);
        return;
      }
      if (message.type === 'OPS_REFRESH') {
        requestBootstrap('HOST_REFRESH');
        return;
      }
      if (message.type === 'OPS_ACTION_RESULT') {
        const payload = asObject(message.payload);
        const pending = STATE.pendingActions.get(payload.requestId);
        STATE.pendingActions.delete(payload.requestId);
        if (payload.ok === false) {
          setSyncState('Error', 'error');
          showToast(payload.error?.message ?? payload.message ?? 'Operation failed.', 'error');
          return;
        }
        closeModal(false);
        if (pending?.successMessage) showToast(pending.successMessage, 'success');
        if (payload.bootstrap || payload.data || payload.staff) applyBootstrap(payload.bootstrap ?? payload.data ?? payload);
        else requestBootstrap('ACTION_COMPLETE');
        return;
      }
      if (message.type === 'OPS_ERROR') {
        const requestId = message.payload?.requestId;
        if (requestId) STATE.pendingActions.delete(requestId);
        STATE.loading = false;
        setSyncState('Error', 'error');
        showToast(message.payload?.message ?? 'OPS synchronization failed.', 'error');
      }
    });

    document.documentElement.style.setProperty('--hour-px', `${STATE.zoomLevel}px`);

    function renderApp() {
      const rosterBody = document.getElementById('rosterBody');
      const ganttRowsContainer = document.getElementById('ganttRowsContainer');
      const ganttHeader = document.getElementById('ganttHeader');
      const alertBadge = document.getElementById('alertBadge');
      
      if(rosterBody) rosterBody.innerHTML = ''; 
      if(ganttRowsContainer) ganttRowsContainer.innerHTML = '';
      hidePopover();
      hideContextMenu();

      if(ganttHeader) {
        const start = new Date(STATE.windowStart);
        start.setUTCDate(start.getUTCDate() + STATE.currentDateOffset);
        const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
        ganttHeader.innerHTML = Array.from({ length: 8 }, (_, index) => {
          const day = new Date(start);
          day.setUTCDate(day.getUTCDate() + index);
          return `<div class="gantt-day-col">${escapeHtml(formatter.format(day))}</div>`;
        }).join('');
      }

      const filteredData = STATE.crewData.filter(crew => {
        const matchSearch = crew.name.toLowerCase().includes(STATE.filters.search) || crew.role.toLowerCase().includes(STATE.filters.search) || crew.base.toLowerCase().includes(STATE.filters.search);
        const matchRole = STATE.filters.role.length === 0 || STATE.filters.role.includes(crew.role);
        const matchBase = STATE.filters.base.length === 0 || STATE.filters.base.includes(crew.base);

        const jRules = STATE.jurisdictions[crew.base] || {};
        const p7 = jRules.maxDuty7 ? (crew.ftl.d7 / jRules.maxDuty7) * 100 : 0;
        const p28 = jRules.maxFlight28 ? (crew.ftl.f28 / jRules.maxFlight28) * 100 : 0;
        const p365 = jRules.maxFlight365 ? (crew.ftl.f365 / jRules.maxFlight365) * 100 : 0;

        let compStatus = 'Legal';
        if (p7 > 100 || p28 > 100 || p365 > 100 || crew.acts.some(a => a.type === 'disrupted')) compStatus = 'Violation';
        else if (p7 > 90 || p28 > 90 || p365 > 90 || crew.alert === 'warn') compStatus = 'Warning';

        const matchComp = STATE.filters.compliance.includes(compStatus);
        return matchSearch && matchRole && matchBase && matchComp;
      });

      filteredData.forEach(crew => {
        if(!rosterBody || !ganttRowsContainer) return;
        const rRow = document.createElement('div');
        rRow.className = 'roster-row';
        rRow.dataset.crewId = crew.id;
        
        let alertIcon = '';
        if (crew.alert === 'danger') alertIcon = '<span class="alert-icon">▲</span>';
        if (crew.alert === 'warn') alertIcon = '<span class="alert-icon alert-warn">▲</span>';
        let nameTitle = STATE.markTitles && crew.role === 'Driver' ? `[DRV] ${crew.name}` : crew.name;

        rRow.innerHTML = `
          <div class="col-icon"><div class="crew-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div></div>
          <div class="col-ci"><div class="checkin-dot ${crew.checkin}"></div></div>
          <div class="col-name" title="${escapeHtml(nameTitle)}">${escapeHtml(nameTitle)} ${alertIcon}</div>
          <div class="col-flight"><span class="flight-tag ${escapeHtml(crew.badge)}">${escapeHtml(crew.assigned)}</span></div>
          <div class="col-role">${escapeHtml(crew.role)}</div>
          <div class="col-cost">${escapeHtml(crew.base)}</div>
        `;
        rosterBody.appendChild(rRow);

        const gRow = document.createElement('div');
        gRow.className = 'gantt-row';
        gRow.dataset.crewId = crew.id;

        crew.acts.forEach(act => {
          if (!STATE.filters.activities.includes(act.type)) return;

          const bar = document.createElement('div');
          bar.className = `activity-bar bg-${act.type}`;
          if (act.type === 'sby' && act.isCalloutCandidate) bar.classList.add('standby-pulse');
          
          bar.style.left = `calc(var(--hour-px) * ${act.startH})`;
          bar.style.width = `calc(var(--hour-px) * ${act.durH})`;
          bar.textContent = act.label;

          bar.addEventListener('click', (e) => handleBarClick(e, crew, act));
          
          gRow.appendChild(bar);
        });

        [rRow, gRow].forEach(el => {
          el.addEventListener('mouseenter', () => highlightRow(crew.id, true));
          el.addEventListener('mouseleave', () => highlightRow(crew.id, false));
        });

        ganttRowsContainer.appendChild(gRow);
      });

      const hasAlerts = STATE.crewData.some(c => c.acts.some(a => a.type === 'disrupted') || c.alert === 'danger');
      if(alertBadge) alertBadge.style.display = hasAlerts ? 'block' : 'none';

      if (STATE.initialized && filteredData.length === 0 && rosterBody) {
        rosterBody.innerHTML = '<div class="empty-state">No staff or assignments match the current scope.</div>';
      }
      
      updateNowLine();
      renderAlertsDrawer();
      renderFTL();
      renderVacation();
      renderMyRosterRequests();
      renderTripTrades();
      renderLogistics();
      renderMessages();
      renderAudit();
      renderOpenTime();
      
      const windowStart = new Date(STATE.windowStart);
      windowStart.setUTCDate(windowStart.getUTCDate() + STATE.currentDateOffset);
      const windowEnd = new Date(windowStart);
      windowEnd.setUTCDate(windowEnd.getUTCDate() + 7);
      const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
      document.getElementById('dateWindowSpan').textContent = `${formatter.format(windowStart)} - ${formatter.format(windowEnd)}`;
    }

    function zoomGantt(direction) {
      if (direction === 'in') STATE.zoomLevel = Math.min(STATE.zoomLevel * 1.5, 30);
      if (direction === 'out') STATE.zoomLevel = Math.max(STATE.zoomLevel / 1.5, 3);
      document.documentElement.style.setProperty('--hour-px', `${STATE.zoomLevel}px`);
    }
    
    function zoomGanttFromSettings(val) {
      STATE.zoomLevel = parseFloat(val);
      document.documentElement.style.setProperty('--hour-px', `${STATE.zoomLevel}px`);
      showToast(`Timeline zoom updated to ${val}px/hr`);
    }
    
    function shiftDate(dir) {
      const start = new Date(STATE.windowStart);
      start.setUTCDate(start.getUTCDate() + dir);
      STATE.windowStart = start.toISOString();
      STATE.currentDateOffset = 0;
      requestBootstrap('DATE_WINDOW_CHANGED');
    }

    function saveSettings() {
      const themeVal = document.getElementById('settingTheme').value;
      if (themeVal === 'light') document.body.classList.add('theme-high-contrast');
      else document.body.classList.remove('theme-high-contrast');
      zoomGanttFromSettings(document.getElementById('settingZoom').value);
      showToast('Display settings applied for this session.', 'success');
    }

   function togglePane(pane) {
      // Define the SVGs as variables so we can swap them easily
      const svgLeft = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>`;
      const svgRight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>`;

      if (pane === 'roster') {
        STATE.rosterCollapsed = !STATE.rosterCollapsed;
        const p = document.getElementById('rosterPane');
        const h = p.querySelector('.pane-handle');
        if (STATE.rosterCollapsed) { p.classList.add('collapsed'); h.innerHTML = svgRight; } 
        else { p.classList.remove('collapsed'); h.innerHTML = svgLeft; }
      } else if (pane === 'filters') {
        STATE.filtersCollapsed = !STATE.filtersCollapsed;
        const p = document.getElementById('filterSidebar');
        const w = document.getElementById('filterSidebarWrapper');
        const h = w.querySelector('.pane-handle');
        if (STATE.filtersCollapsed) { p.classList.add('collapsed'); h.innerHTML = svgLeft; } 
        else { p.classList.remove('collapsed'); h.innerHTML = svgRight; }
      }
      setTimeout(() => syncScroll(document.getElementById('ganttBody'), 'horizontal'), 350);
    }

    function toggleOpenTime() {
      document.getElementById('openTimeTray').classList.toggle('open');
      requestAnimationFrame(sendHeight);
    }

    function switchView(viewId, navElement) {
      document.querySelectorAll('.nav-icon').forEach(n => n.classList.remove('active'));
      if(navElement) navElement.classList.add('active');
      else {
        const match = document.getElementById(`nav${viewId.split('-')[1].charAt(0).toUpperCase() + viewId.split('-')[1].slice(1)}`);
        if(match) match.classList.add('active');
      }
      
      document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');
      hidePopover(); hideContextMenu();
      requestAnimationFrame(sendHeight);
    }

    function highlightRow(id, active) {
      const r = document.querySelector(`.roster-row[data-crew-id="${id}"]`);
      const g = document.querySelector(`.gantt-row[data-crew-id="${id}"]`);
      if(r) active ? r.classList.add('selected') : r.classList.remove('selected');
      if(g) active ? g.classList.add('selected') : g.classList.remove('selected');
    }

    let isSyncingLeft = false, isSyncingRight = false;
    function syncScroll(source, mode) {
      hidePopover(); hideContextMenu();
      const roster = document.getElementById('rosterBody');
      const gantt = document.getElementById('ganttBody');
      if (!roster || !gantt) return;
      if (mode === 'vertical' || mode === 'both') {
        if (source === roster && !isSyncingLeft) { isSyncingRight = true; gantt.scrollTop = roster.scrollTop; }
        else if (source === gantt && !isSyncingRight) { isSyncingLeft = true; roster.scrollTop = gantt.scrollTop; }
        isSyncingLeft = isSyncingRight = false;
      }
    }

    function updateNowLine() {
      const now = new Date();
      const start = new Date(STATE.windowStart);
      start.setUTCDate(start.getUTCDate() + STATE.currentDateOffset);
      const offsetHours = (now.getTime() - start.getTime()) / 3600000;
      const nLine = document.getElementById('nowLine');
      const nTag = document.getElementById('nowTag');
      if(nLine && nTag) {
        const visible = offsetHours >= 0 && offsetHours <= 192;
        nLine.style.display = visible ? 'block' : 'none';
        nTag.style.display = visible ? 'block' : 'none';
        nLine.style.left = `calc(var(--hour-px) * ${offsetHours})`;
        nTag.style.left = `calc(var(--hour-px) * ${offsetHours})`;
      }
    }

    function showPopover(e, crew, act) {
      if (document.getElementById('contextMenu').classList.contains('visible')) return; 
      
      document.getElementById('popTitle').innerHTML = `<span>${act.label || act.type.toUpperCase()}</span><span class="j-badge ${act.status==='ON-TIME'?'green':act.status==='STANDBY'?'yellow':'red'}" style="font-size:8px">${act.status}</span>`;
      document.getElementById('popStatus').textContent = act.status;
      document.getElementById('popCrew').textContent = crew.name;
      document.getElementById('popType').textContent = act.type.toUpperCase();
      document.getElementById('popDur').textContent = `${act.durH} Hours`;

      const rect = e.target.getBoundingClientRect();
      const ganttRect = document.getElementById('ganttBody').getBoundingClientRect();
      let top = rect.bottom - ganttRect.top + document.getElementById('ganttBody').scrollTop + 5;
      let left = rect.left - ganttRect.left + document.getElementById('ganttBody').scrollLeft;

      if (left + 240 > document.getElementById('ganttBody').scrollWidth) left = left - 240 + rect.width;
      
      const popover = document.getElementById('popover');
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      popover.classList.add('visible');
    }

    function hidePopover() { document.getElementById('popover').classList.remove('visible'); }

    function handleBarClick(e, crew, act) {
      e.stopPropagation();
      hidePopover();
      
      if (STATE.editMode) {
        openEditModal(crew.id, act.id);
        return;
      }

      const menu = document.getElementById('contextMenu');
      menu.innerHTML = '';
      
      const addMenuItem = (text, icon, action) => {
        const div = document.createElement('div');
        div.className = 'context-menu-item';
        div.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
        div.onclick = (ev) => { ev.stopPropagation(); hideContextMenu(); action(); };
        menu.appendChild(div);
      };

      addMenuItem('Edit Assignment', '✏️', () => openEditModal(crew.id, act.id));
      if (act.type === 'sby') addMenuItem('Activate Standby', '📞', () => openStandbyModal(crew.id, act.id));
      
      menu.appendChild(document.createElement('div')).className = 'context-menu-divider';
      addMenuItem('Acknowledge Alert', '✅', () => dispatchAction('ACKNOWLEDGE_ALERT', {
        sourceId: act.sourceId,
        sourceTable: act.sourceTable,
        jurisdiction: STATE.jurisdiction
      }, 'Alert acknowledged.'));

      const rect = e.target.getBoundingClientRect();
      const ganttRect = document.getElementById('ganttBody').getBoundingClientRect();
      let top = rect.bottom - ganttRect.top + document.getElementById('ganttBody').scrollTop;
      let left = rect.left - ganttRect.left + document.getElementById('ganttBody').scrollLeft;
      
      if (left + 200 > document.getElementById('ganttBody').scrollWidth) left = left - 200 + rect.width;
      
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.classList.add('visible');
    }

    function hideContextMenu() { document.getElementById('contextMenu').classList.remove('visible'); }
    
    document.addEventListener('click', (e) => {
      if(!e.target.classList.contains('activity-bar')) {
        hidePopover(); hideContextMenu();
      }
    });

    function toggleEditMode() {
      STATE.editMode = !STATE.editMode;
      const btn = document.getElementById('btnEditMode');
      const badge = document.getElementById('editBadge');
      if (STATE.editMode) {
        btn.classList.add('active-toggle'); badge.style.display = 'inline-block';
        document.body.classList.add('edit-mode');
        showToast('Operation Edit Mode Enabled', 'success');
      } else {
        btn.classList.remove('active-toggle'); badge.style.display = 'none';
        document.body.classList.remove('edit-mode');
        showToast('Edit Mode Disabled');
      }
    }

    function toggleMarkTitles() {
      STATE.markTitles = !STATE.markTitles;
      const btn = document.getElementById('btnMarkTitles');
      STATE.markTitles ? btn.classList.add('active-toggle') : btn.classList.remove('active-toggle');
      renderApp();
    }

    function openEditModal(crewId, actId) {
      const crew = STATE.crewData.find(c => c.id === crewId);
      const act = crew.acts.find(a => a.id === actId);
      if (!act) return;
      STATE.selectedCrewId = crewId; STATE.selectedActId = actId;
      document.getElementById('editLabel').value = act.label;
      document.getElementById('editType').value = act.type;
      document.getElementById('editStatus').value = act.status;
      showModal('editModal');
    }

    function saveAssignment() {
      const crew = STATE.crewData.find(c => c.id === STATE.selectedCrewId);
      const act = crew?.acts.find(a => a.id === STATE.selectedActId);
      if (!crew || !act) return showToast('Assignment is no longer available.', 'error');
      dispatchAction('UPDATE_ASSIGNMENT', {
        sourceId: act.sourceId,
        sourceTable: act.sourceTable,
        label: document.getElementById('editLabel').value.trim(),
        type: document.getElementById('editType').value,
        status: document.getElementById('editStatus').value,
        jurisdiction: STATE.jurisdiction
      }, 'Assignment updated.');
    }

    function openStandbyModal(crewId, actId) {
      STATE.selectedCrewId = crewId; STATE.selectedActId = actId;
      document.getElementById('sbyFlightNum').value = '';
      showModal('standbyModal');
    }

    function executeStandbyCallout() {
      const flightNum = document.getElementById('sbyFlightNum').value.trim();
      const type = document.getElementById('sbyType').value;
      const crew = STATE.crewData.find(c => c.id === STATE.selectedCrewId);
      const act = crew?.acts.find(a => a.id === STATE.selectedActId);
      if (!crew || !act || !flightNum) return showToast('Enter an operation reference.', 'error');
      dispatchAction('ACTIVATE_STANDBY', {
        sourceId: act.sourceId,
        sourceTable: act.sourceTable,
        label: flightNum,
        activityType: type,
        jurisdiction: STATE.jurisdiction
      }, `${crew.name} assigned to ${flightNum}.`);
    }
    
    function openMessageModal() {
        if (STATE.crewData.length === 0) return showToast('No staff are available.', 'error');
        const select = document.getElementById('msgRecipientSelect');
        if(select) {
            select.innerHTML = STATE.crewData.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.role)})</option>`).join('');
        }
        document.getElementById('msgSubject').value = '';
        document.getElementById('msgBody').value = '';
        showModal('messageModal');
    }
    
    function sendMessage() {
        showToast('Operational messaging is managed in GroupTalk.', 'error');
    }

    function openOptimizerModal() {
      const disruptions = STATE.crewData.flatMap(c => c.acts.filter(a => a.type === 'disrupted'));
      if (disruptions.length === 0) return showToast('System is stable. No conflicts to resolve.', 'success');
      
      showModal('optimizerModal');
      const consoleBox = document.getElementById('optConsole');
      const progressText = document.getElementById('optProgressText');
      const closeBtn = document.getElementById('btnOptClose');
      
      consoleBox.innerHTML = '<div class="console-line info">&gt; Optimization request sent to OPS backend…</div>';
      progressText.textContent = 'RUNNING';
      closeBtn.style.display = 'none';
      dispatchAction('OPTIMIZE', {
        windowStart: STATE.windowStart,
        dateOffset: STATE.currentDateOffset,
        jurisdiction: STATE.jurisdiction
      }, 'Optimization completed.');
    }

    function handleFilterChange() {
      STATE.filters.search = document.getElementById('searchInput').value.toLowerCase();
      STATE.filters.base = Array.from(document.querySelectorAll('.filter-base:checked')).map(c => c.value);
      STATE.filters.role = Array.from(document.querySelectorAll('.filter-role:checked')).map(c => c.value);
      STATE.filters.compliance = Array.from(document.querySelectorAll('.filter-comp:checked')).map(c => c.value);
      STATE.filters.activities = Array.from(document.querySelectorAll('.filter-act:checked')).map(c => c.value);
      renderApp();
    }

    function toggleSection(headerEl) {
      const content = headerEl.nextElementSibling;
      const icon = headerEl.querySelector('span:last-child');
      if (content.style.display === 'none') { content.style.display = 'block'; icon.textContent = '▼'; } 
      else { content.style.display = 'none'; icon.textContent = '▶'; }
    }

    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(c => c.checked = true);
      handleFilterChange(); showToast('Filters Reset');
    }

    function renderFTL() {
      const tbody = document.getElementById('ftlTableBody');
      if(!tbody) return;
      if (STATE.crewData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No compliance records available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.crewData.map(c => {
        const jRules = STATE.jurisdictions[c.base] || {};
        const rawP7 = jRules.maxDuty7 ? (c.ftl.d7 / jRules.maxDuty7) * 100 : 0;
        const rawP28 = jRules.maxFlight28 ? (c.ftl.f28 / jRules.maxFlight28) * 100 : 0;
        const rawP365 = jRules.maxFlight365 ? (c.ftl.f365 / jRules.maxFlight365) * 100 : 0;
        const p7 = Math.min(100, rawP7);
        const p28 = Math.min(100, rawP28);
        const p365 = Math.min(100, rawP365);
        
        let status = '<span class="j-badge green">LEGAL</span>';
        if (rawP7 > 100 || rawP28 > 100 || rawP365 > 100 || c.acts.some(a => a.type === 'disrupted')) {
            status = '<span class="j-badge red">VIOLATION</span>';
        } else if (p7 > 90 || p28 > 90 || p365 > 90 || c.alert === 'warn') {
            status = '<span class="j-badge yellow">WARNING</span>';
        }

        return `<tr><td><b>${escapeHtml(c.name)}</b></td><td>${escapeHtml(c.base)}</td><td>${escapeHtml(c.role)}</td>
          <td>${c.ftl.d7}h <div class="ftl-progress-bg"><div class="ftl-progress-fg" style="width:${p7}%; background: ${p7>90?'var(--bar-disruption)':'var(--j-accent)'}"></div></div></td>
          <td>${c.ftl.f28}h <div class="ftl-progress-bg"><div class="ftl-progress-fg" style="width:${p28}%; background: ${p28>90?'var(--bar-disruption)':'var(--j-accent)'}"></div></div></td>
          <td>${c.ftl.f365}h <div class="ftl-progress-bg"><div class="ftl-progress-fg" style="width:${p365}%; background: ${p365>90?'var(--bar-disruption)':'var(--j-accent)'}"></div></div></td>
          <td>${escapeHtml(jRules.name ?? 'Not configured')}</td><td>${status}</td></tr>`;
      }).join('');
    }

    function renderVacation() {
      const tbody = document.getElementById('vacationTableBody');
      if(!tbody) return;
      
      window.approveVac = function(id) {
          const v = STATE.vacations.find(x => x.id === id);
          if (!v) return showToast('Vacation request is no longer available.', 'error');
          dispatchAction('APPROVE_VACATION', {
            sourceId: v.sourceId,
            requestId: v.id,
            jurisdiction: STATE.jurisdiction
          }, `Vacation ${id} approved.`);
      };

      if (STATE.vacations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No vacation requests available.</td></tr>';
      } else {
      tbody.innerHTML = STATE.vacations.map(v => {
        const jRules = STATE.jurisdictions[v.base] || {};
        return `<tr><td><b>${escapeHtml(v.id)}</b></td><td>${escapeHtml(v.name)}</td><td>${escapeHtml(v.base)}</td><td>${escapeHtml(v.period)}</td><td>${escapeHtml(v.days)} Days</td><td>${escapeHtml(jRules.name ?? 'Not configured')}</td><td><span class="j-badge ${v.status==='APPROVED'?'green':'yellow'}">${escapeHtml(v.status)}</span></td><td>${v.status === 'PENDING REVIEW' ? `<button class="btn primary" onclick="approveVac('${escapeHtml(v.id)}')">Approve</button>` : '<span style="color:var(--j-text-muted)">Locked</span>'}</td></tr>`;
      }).join('');
      }

      const staffSelect = document.getElementById('vacStaffSelect');
      if(staffSelect) {
          staffSelect.innerHTML = STATE.crewData.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.base)})</option>`).join('');
      }
    }

    function renderMyRosterRequests() {
      const tbody = document.getElementById('myRosterRequestsBody');
      if (!tbody) return;
      window.resolveMyRosterRequest = function(id, decision, button) {
        const request = STATE.myRosterRequests.find(item => item.id === id);
        if (!request) return showToast('Staff request is no longer available.', 'error');
        if (!['APPROVED', 'REJECTED'].includes(decision)) return;
        if (button) button.disabled = true;
        const verb = decision === 'APPROVED' ? 'approved' : 'declined';
        dispatchAction('RESOLVE_MYROSTER_REQUEST', {
          sourceId: request.sourceId,
          decision
        }, `Staff ${request.type.toLowerCase()} request ${verb}.`);
      };
      if (!STATE.myRosterRequests.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No MyRoster or EOS requests are waiting for OPS review.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.myRosterRequests.map(request => {
        const pending = ['PENDING', 'PENDING REVIEW', 'SUBMITTED', 'OPEN'].includes(request.status);
        const actions = pending
          ? `<button class="btn primary" onclick="resolveMyRosterRequest('${escapeHtml(request.id)}','APPROVED',this)">Approve</button> <button class="btn" onclick="resolveMyRosterRequest('${escapeHtml(request.id)}','REJECTED',this)">Decline</button>`
          : '<span style="color:var(--j-text-muted)">Reviewed</span>';
        return `<tr><td>${escapeHtml(request.submittedAt || '—')}</td><td><b>${escapeHtml(request.name || request.employeeId || 'Staff')}</b></td><td>${escapeHtml(request.base || '—')}</td><td>${escapeHtml(request.type)}</td><td>${escapeHtml([request.period, request.summary].filter(Boolean).join(' · ') || '—')}</td><td><span class="j-badge ${pending ? 'yellow' : request.status === 'APPROVED' ? 'green' : 'red'}">${escapeHtml(request.status)}</span></td><td>${actions}</td></tr>`;
      }).join('');
    }

    function renderTripTrades() {
      const tbody = document.getElementById('tradeTableBody');
      if(!tbody) return;

      window.approveTrade = function(id) {
          const t = STATE.trades.find(x => x.id === id);
          if (!t) return showToast('TripTrade request is no longer available.', 'error');
          dispatchAction('APPROVE_TRIP_TRADE', {
            sourceId: t.sourceId,
            requestId: t.id,
            jurisdiction: STATE.jurisdiction
          }, `Trade ${id} approved.`);
      };

      if (STATE.trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No TripTrade requests available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.trades.map(t => {
        const crewAObj = STATE.crewData.find(c => c.name === t.crewA);
        const jRules = crewAObj ? (STATE.jurisdictions[crewAObj.base]?.name ?? 'Not configured') : 'Checked';
        return `<tr><td><b>${escapeHtml(t.id)}</b></td><td>${escapeHtml(t.crewA)}</td><td>${escapeHtml(t.crewB)}</td><td>${escapeHtml(t.details)}</td><td><span class="j-badge green">${escapeHtml(jRules)} OK</span></td><td>${escapeHtml(String(t.status ?? '').replace('_', ' '))}</td><td>${t.status === 'AWAITING_OCC' ? `<button class="btn primary" onclick="approveTrade('${escapeHtml(t.id)}')">Approve</button>` : '<span style="color:var(--j-text-muted)">Processed</span>'}</td></tr>`;
      }).join('');
    }

    function renderLogistics() {
      const tbody = document.getElementById('logisticsTableBody');
      if(!tbody) return;
      
      window.toggleLogistic = function(id) {
          showToast('Logistics updates are read-only in this OPS backend.', 'error');
      }
      if (STATE.logistics.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No logistics records available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.logistics.map(l => `<tr><td><b>${escapeHtml(l.id)}</b></td><td>${escapeHtml(l.name)}</td><td>${escapeHtml(l.loc)}</td><td>${escapeHtml(l.supplier)}</td><td>${escapeHtml(l.dates)}</td><td><span class="j-badge ${l.status==='CONFIRMED'?'green':'yellow'}">${escapeHtml(l.status)}</span></td><td><span style="color:var(--j-text-muted)">Read only</span></td></tr>`).join('');
    }

    function renderMessages() {
      const tbody = document.getElementById('messagesTableBody');
      if(!tbody) return;
      
      window.readMsg = function(id) {
          showToast('Message receipts are managed in GroupTalk.', 'error');
      }
      if (STATE.messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No operational messages available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.messages.map(m => `<tr><td>${escapeHtml(m.time)}</td><td><b>${escapeHtml(m.recipient)}</b></td><td>${escapeHtml(m.channel)}</td><td>${escapeHtml(m.subject)}</td><td><span class="j-badge green">${escapeHtml(m.status)}</span></td><td><span class="j-badge ${m.read==='READ'?'green':'red'}">${escapeHtml(m.read)}</span></td><td><span style="color:var(--j-text-muted)">Read only</span></td></tr>`).join('');
    }

    function renderBidding() {
      const tbody = document.getElementById('biddingTableBody');
      if(!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Bidding data is supplied by OPS.</td></tr>';
    }

    function renderAudit() {
      const tbody = document.getElementById('auditTableBody');
      if(!tbody) return;
      if (STATE.auditLog.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No audit records available.</td></tr>';
        return;
      }
      tbody.innerHTML = STATE.auditLog.map(log => `<tr><td>${escapeHtml(log.time)}</td><td><b>${escapeHtml(log.action)}</b></td><td>${escapeHtml(log.details)}</td><td><span class="j-badge green">${escapeHtml(log.status)}</span></td></tr>`).join('');
    }

    function openVacationModal() {
      if (STATE.crewData.length === 0) return showToast('No staff are available.', 'error');
      showModal('vacationModal');
    }
    function submitVacationRequest() {
      const staffSelect = document.getElementById('vacStaffSelect');
      const staffId = staffSelect.value;
      const staff = STATE.crewData.find(c => c.id === staffId);
      const startDate = document.getElementById('vacStart').value;
      const endDate = document.getElementById('vacEnd').value;
      if (!staff || !startDate || !endDate || Date.parse(endDate) < Date.parse(startDate)) {
        return showToast('Select a staff member and a valid date range.', 'error');
      }
      dispatchAction('CREATE_VACATION_REQUEST', {
        agentId: staff.agentId,
        startDate,
        endDate
      }, `Vacation requested for ${staff.name}.`);
    }

    let alertsOpen = false;
    function toggleAlerts() {
      alertsOpen = !alertsOpen;
      const drawer = document.getElementById('alertsDrawer');
      const btn = document.getElementById('btnAlerts');
      if (alertsOpen) { drawer.classList.add('open'); btn.classList.add('active'); } 
      else { drawer.classList.remove('open'); btn.classList.remove('active'); }
    }

    function renderAlertsDrawer() {
      const list = document.getElementById('alertList');
      if(!list) return;
      list.innerHTML = ''; let hasAlert = false;
      STATE.crewData.forEach(crew => {
        crew.acts.forEach(act => {
          if (act.type === 'disrupted' || (act.type === 'sby' && act.isCalloutCandidate)) {
            hasAlert = true; const isCallout = act.type === 'sby';
            const card = document.createElement('div');
            card.className = `alert-card ${isCallout ? 'warning' : ''}`;
            card.innerHTML = `<div class="alert-title">${isCallout ? 'STANDBY CALLOUT REQUIRED' : (act.label || 'Violation')}</div><div class="alert-desc">Staff: ${crew.name}<br>Status: ${act.status}</div><div style="font-size:10px; color:var(--j-accent);">CLICK TO RESOLVE</div>`;
            card.onclick = () => { if (window.innerWidth <= 900) toggleAlerts(); switchView('view-tracking', document.getElementById('navTracking')); document.getElementById('searchInput').value = crew.name; handleFilterChange(); if (isCallout) openStandbyModal(crew.id, act.id); };
            list.appendChild(card);
          }
        });
      });
      if (!hasAlert) list.innerHTML = '<div style="color:var(--j-text-muted); text-align:center; padding: 20px;">No active alerts. System nominal.</div>';
    }

    function toggleFiltersMobile() { document.getElementById('filterSidebarWrapper').classList.toggle('open'); }

    function showModal(id) { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); document.getElementById('modalOverlay').classList.add('visible'); document.getElementById(id).style.display = 'block'; requestAnimationFrame(sendHeight); }
    function closeModal(shouldRender = true) { document.getElementById('modalOverlay').classList.remove('visible'); if (shouldRender) renderApp(); requestAnimationFrame(sendHeight); }
    function closeModalOnBgClick(e) { if (e.target.id === 'modalOverlay') closeModal(); }

    function showToast(message, type = 'normal') {
      const container = document.getElementById('toastContainer');
      if(!container) return;
      const toast = document.createElement('div'); toast.className = `toast ${type}`;
      toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
      container.appendChild(toast);
      setTimeout(() => { if (toast.parentElement) { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); } }, 3000);
    }

    function renderOpenTime() {
      const container = document.getElementById('openTimeTrayBody');
      if (!container) return;
      if (STATE.openTime.length === 0) {
        container.innerHTML = '<div class="empty-state">No unassigned operations.</div>';
        return;
      }
      container.innerHTML = STATE.openTime.map(item => {
        const id = idOf(item.id ?? item.operationId ?? item.operation_id);
        const reference = item.reference ?? item.label ?? item.title ?? id;
        const route = item.route ?? item.location ?? item.description ?? '';
        const time = item.startAt ?? item.start_at ?? item.time ?? '';
        return `<div class="open-flight-card" onclick="selectOpenTime('${escapeHtml(id)}')"><div class="of-flight">${escapeHtml(reference)}</div><div class="of-route">${escapeHtml([route, time].filter(Boolean).join(' • '))}</div></div>`;
      }).join('');
    }

    function selectOpenTime(operationId) {
      const item = STATE.openTime.find(row => idOf(row.id ?? row.operationId ?? row.operation_id) === operationId);
      showToast(item ? `Selected ${item.label ?? item.reference ?? operationId}` : 'Open operation selected.');
    }

    window.onload = () => {
      renderApp();
      postToWix('MASTER_CONFIG_REQUEST', { purpose: 'ALTEA_LOGO' });
      postToWix('OPS_READY', {
        version: 'V12-OPS-CONTROL-2026.10.14',
        contractVersion: 2,
        canonicalStaffId: 'agentId'
      });
      requestBootstrap('INITIAL_LOAD');
      setInterval(updateNowLine, 60000); // update now line every minute
      setInterval(() => { if (!STATE.loading && STATE.pendingActions.size === 0 && document.visibilityState === 'visible') requestBootstrap('PERIODIC_SYNC'); }, 60000);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !STATE.lastSyncAt) return;
      if (Date.now() - Date.parse(STATE.lastSyncAt) > 60000) requestBootstrap('VISIBILITY_RESUME');
    });
  // V12 APP_VIEWPORT_ALTEA: Wix owns the fixed app region; no iframe height mutation.
  function sendHeight() {}
  
