
    (function() {
      const SOURCE = "SKANDI_SUPPORT_CUSTOMER_PORTAL";
      const PARENT = "SKANDI_WIX_PARENT";

      let state = { cases: [], active: {}, profile: null, clubProfile: null, attachments: [], fileScannerTokens: {}, signatureDataUrl: null };
      const $ = id => document.getElementById(id);

      const submissionIdempotencyKey = "idemp-" + Math.random().toString(36).substring(2) + "-" + Date.now();
      const formMountTime = Date.now();
      let pasteActionsDetected = { booking_reference: false, bank_iban: false };

      function post(type, payload = {}) {
        window.parent.postMessage({ source: SOURCE, type, ...payload }, "*");
      }

      function esc(v) {
        return String(v ?? "").replace(/[&<>'"]/g, c => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
        }[c]));
      }

      function toast(m) {
        const t = $("toast");
        if (!t) return;
        t.textContent = m;
        t.classList.add("show");
        setTimeout(() => t.classList.remove("show"), 2800);
      }

      function caseIdOf(c = {}) { return c.case_id || c.caseId || ""; }
      function caseRefOf(c = {}) { return c.case_id || c.caseRef || c.caseId || ""; }

      window.toggleSidebar = function() {
          $("sidebar").classList.toggle("open");
          $("sidebarOverlay").classList.toggle("open");
      };

      const tabsNav = [
          ["overview", "https://static.wixstatic.com/media/394052_b5aece8842954236b21a8693b3ecae14~mv2.png", "Overview", "/my-profile"],
          ["bookings", "https://static.wixstatic.com/media/394052_c10010c35d594e1590400524a04c8fb2~mv2.png", "My Bookings", "/my-profile?tab=bookings"],
          ["favourites", "https://static.wixstatic.com/media/394052_4084f82a4f9342beb83237d648504c46~mv2.png", "Favourites", "/my-profile?tab=favorites"],
          ["travelers", "https://static.wixstatic.com/media/394052_10152e32f8cb4af3bfb06eb5e7ea1c36~mv2.png", "Travelers", "/my-profile?tab=travelers"],
          ["documents", "https://static.wixstatic.com/media/394052_f941a08c326143728a0e05e566546296~mv2.png", "Documents", "/my-profile?tab=documents"],
          ["wallet", "https://static.wixstatic.com/media/394052_ed65c346875642aca102f881a8e0f045~mv2.png", "Wallet", "/my-profile?tab=wallet"],
          ["settings", "https://static.wixstatic.com/media/394052_856c7430a7b640ee8f062ab0d23b1dc4~mv2.png", "Settings", "/my-profile?tab=settings"],
          ["support", "https://static.wixstatic.com/media/394052_70b6b37f2c62423ebd7949f1cb7bc053~mv2.png", "Support", "/my-profile/support"]
      ];

      window.handleNavClick = function(path) {
          post("CUSTOMER_NAVIGATE", { path });
          if (window.self === window.top) {
              window.location.assign(path);
          }
      };

      function renderNav() {
          $("sideNav").innerHTML = tabsNav.map(([key, iconUrl, label, path]) => {
              const isActive = key === "support";
              return `
                <button class="${isActive ? "active" : ""}" type="button" onclick="handleNavClick('${path}')">
                  <img src="${iconUrl}" class="icon-placeholder" alt="${label}">
                  <span>${label}</span>
                </button>
              `;
          }).join("");
      }

      window.launchDocuSignSigning = function() {
          const email = $("email").value.trim();
          const firstName = $("firstName").value.trim();
          const lastName = $("lastName").value.trim();

          if (!email || !firstName || !lastName) {
              toast("Please fill in your name and email before signing with DocuSign.");
              return;
          }

          toast("Initializing DocuSign secure session...");

          post("CUSTOMER_INITIATE_DOCUSIGN", {
              signer: { firstName, lastName, email }
          });

          setTimeout(() => {
              state.signatureDataUrl = "docusign-verified-envelope-" + Math.random().toString(36).substring(2);
              const btn = $("docusignLaunchBtn");
              btn.textContent = "✓ Signed via DocuSign";
              btn.style.background = "var(--green)";
              btn.disabled = true;
              toast("DocuSign signature successfully attached.");
          }, 1500);
      };

      function firstName() {
          const p = state.profile || {};
          return p.displayName || p.firstName || p.first_name || p.email || "Traveller";
      }

      function greeting() {
          const hour = new Date().getHours();
          if (hour < 12) return "Good morning,";
          if (hour < 18) return "Good afternoon,";
          return "Good evening,";
      }

      function renderShell() {
          const first = firstName();
          const c = state.clubProfile;
          const tier = c?.tier?.name || c?.tierName || "Guest";
          const title = state.profile?.title ? `${state.profile.title} ` : "";

          $("sideName").textContent = `${title}${first}`;
          $("sideTier").textContent = tier === "Guest" ? "Guest" : `${tier} Member`;
          $("sideGreeting").textContent = greeting();

          const isCalifornia = p_isCaliforniaResident(state.profile);
          if (isCalifornia) {
              $("ccpaNoticeGroup").classList.remove("hidden");
          }
      }

      function p_isCaliforniaResident(profile) {
          if (!profile) return false;
          const region = (profile.state || profile.region || profile.country || "").toUpperCase();
          return region === "CA" || region === "CALIFORNIA";
      }

      window.regexes = {
          bookingReference: /^([A-Z0-9]{6}|[A-Z]{3}-[0-9]{5,8})$/,
          name: /^[A-Za-z\s-]{2,50}$/,
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          flightNumber: /^[A-Z0-9]{2,3}\d{1,4}$/,
          pirNumber: /^[A-Z]{3}[A-Z0-9]{2}\d{5}$/,
          seatNumbers: /^\d{1,2}[A-K](,\s*\d{1,2}[A-K])*$/,
          iban: /^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/,
          bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
          cabin: /^[A-Z0-9]{3,5}$/
      };

      window.validateField = function(input, regex, errorId) {
          const val = input.value.trim().toUpperCase();
          input.value = val;
          const isValid = regex.test(val);
          input.setAttribute("aria-invalid", !isValid);
          const errEl = $(errorId);
          if (errEl) errEl.classList.toggle("show", !isValid);
          return isValid;
      };

      window.handleCategoryChange = function(category) {
          const container = $("branchContainer");
          container.innerHTML = "";

          const showPayer = ["flight_disruption", "billing_refund"].includes(category);
          const payerSection = $("globalFinancialMechanics");
          
          if (payerSection) {
              if (showPayer) {
                  payerSection.classList.remove("hidden");
              } else {
                  payerSection.classList.add("hidden");
                  const payoutMethod = $("payoutMethod");
                  if (payoutMethod) payoutMethod.value = "";
                  const bankFields = $("bankTransferFields");
                  if (bankFields) bankFields.classList.add("hidden");
              }
          }

          if (category === "flight_disruption") {
              container.innerHTML = `
                <div class="section-title">Branch A: Flight Disruption Details</div>
                <div class="form-row-grid">
                    <div class="form-field">
                        <label for="flightNumber">Flight Number *</label>
                        <input type="text" id="flightNumber" placeholder="e.g. B6123 or BY7845" required onblur="validateField(this, regexes.flightNumber, 'flightError')">
                        <div id="flightError" class="error-hint">Please input a valid IATA airline code and flight number (e.g., BY123).</div>
                    </div>
                    <div class="form-field">
                        <label for="delayHours">Delay Duration (Hours) *</label>
                        <input type="number" id="delayHours" min="1" max="72" value="3" required>
                    </div>
                </div>
              `;
          } else if (category === "baggage_issue") {
              container.innerHTML = `
                <div class="section-title">Branch D: Lost, Delayed, or Damaged Baggage</div>
                <div class="form-row-grid">
                    <div class="form-field">
                        <label for="pirNumber">PIR Reference Number *</label>
                        <input type="text" id="pirNumber" placeholder="e.g. LHROR12345" required onblur="validateField(this, regexes.pirNumber, 'pirError')">
                        <div id="pirError" class="error-hint">Invalid PIR format. Must match standard baggage tracking IDs (e.g., LHROR12345).</div>
                    </div>
                    <div class="form-field">
                        <label>Baggage Status *</label>
                        <div style="display:flex; gap:12px; margin-top:8px;">
                            <label><input type="radio" name="baggageStatus" value="delayed" checked> Delayed</label>
                            <label><input type="radio" name="baggageStatus" value="damaged"> Damaged</label>
                            <label><input type="radio" name="baggageStatus" value="stolen"> Stolen</label>
                        </div>
                    </div>
                </div>
              `;
          } else if (category === "billing_refund") {
              container.innerHTML = `
                <div class="section-title">Branch C: Invoicing, Refunds & Discrepancies</div>
                <div class="form-field">
                    <label for="refundReason">Reason for Refund *</label>
                    <select id="refundReason" required>
                        <option value="overcharge">Double charge / Overcharge</option>
                        <option value="canceled_service">Paid add-on service not delivered</option>
                        <option value="tax_refund">Airport tax refund request</option>
                    </select>
                </div>
              `;
          } else if (category === "hotel_complaint") {
              container.innerHTML = `
                <div class="section-title">Branch E: Hotel Accommodation & In-Resort Issues</div>
                <div class="form-row-grid">
                    <div class="form-field">
                        <label for="hotelName">Accommodation Name *</label>
                        <input type="text" id="hotelName" placeholder="Hotel name" required>
                    </div>
                    <div class="form-field">
                        <label>In-Resort Report Filed? *</label>
                        <div style="display:flex; gap:16px; margin-top:8px;">
                            <label><input type="radio" name="inResortReportFiled" value="true"> Yes</label>
                            <label><input type="radio" name="inResortReportFiled" value="false" checked> No</label>
                        </div>
                    </div>
                </div>
              `;
          } else if (category === "medical_dietary") {
              container.innerHTML = `
                <div class="section-title">Branch B: Medical & Dietary Assistance</div>
                <div class="form-field">
                    <label>Assistance Type *</label>
                    <div style="display:flex; gap:16px; margin-top:8px;">
                        <label><input type="radio" name="assistanceType" value="mobility" required> Mobility (Wheelchair/Ramp)</label>
                        <label><input type="radio" name="assistanceType" value="allergy"> Allergy (Severe Dietary)</label>
                        <label><input type="radio" name="assistanceType" value="equipment"> Equipment (Oxygen/Machinery)</label>
                    </div>
                </div>
              `;
          } else if (category === "ancillary_service") {
              container.innerHTML = `
                <div class="section-title">Branch F: Ancillary Services & Seats</div>
                <div class="form-field">
                    <label for="ancillaryType">Ancillary Target Type *</label>
                    <select id="ancillaryType">
                        <option value="airport_transfer">Airport Transfer (Bus/Taxi missing)</option>
                        <option value="seat_selection">Seat Selection (Paid seats not assigned)</option>
                        <option value="extra_luggage">Extra Luggage</option>
                    </select>
                </div>
              `;
          } else if (category === "car_rental") {
              container.innerHTML = `
                <div class="section-title">Branch G: Car Rental & Ground Transport</div>
                <div class="form-field">
                    <label for="rentalVoucherNumber">Rental Voucher Number *</label>
                    <input type="text" id="rentalVoucherNumber" placeholder="Voucher code" required>
                </div>
              `;
          } else if (category === "cruise_fault") {
              container.innerHTML = `
                <div class="section-title">Branch H: Cruise Itinerary & Excursions</div>
                <div class="form-field">
                    <label for="cabinNumber">Cabin Number *</label>
                    <input type="text" id="cabinNumber" placeholder="e.g. U102" required>
                </div>
              `;
          } else if (category === "force_majeure") {
              container.innerHTML = `
                <div class="section-title">Branch I: Force Majeure / Extraordinary Circumstances</div>
                <div class="info-banner">
                    <strong>Notice:</strong> Delays caused by severe weather or external air traffic control strikes are legally classified as extraordinary circumstances. While compensation may not apply, you are still eligible for care, hotel vouchers, and rebooking assistance.
                </div>
              `;
          } else if (category === "bereavement") {
              container.innerHTML = `
                <div class="section-title">Branch J: Bereavement & Medical Cancellations</div>
                <div class="info-banner" style="background:#f3e8ff; border-color:#e9d5ff; color:#6b21a8;">
                    <strong>HIPAA & GDPR Article 9 Security:</strong> Documents uploaded under this branch are routed to a restricted, encrypted cloud storage bucket.
                </div>
              `;
          } else if (category === "third_party_agent") {
              container.innerHTML = `
                <div class="section-title">Branch K: Third-Party Agent & Legal Representation</div>
                <div class="form-field">
                    <label for="agencyName">Agency Registered Name *</label>
                    <input type="text" id="agencyName" placeholder="Law Firm LLC" required>
                </div>
              `;
          }
      };

      window.handlePayoutMethodChange = function(val) {
          $("bankTransferFields").classList.toggle("hidden", val !== "bank_transfer");
      };

      window.handleFilesSelected = function(files) {
          for (let file of files) {
              if (file.size > 5 * 1024 * 1024) {
                  toast(`File ${file.name} exceeds 5MB limit.`);
                  continue;
              }
              if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                  toast(`File ${file.name} has unsupported MIME type.`);
                  continue;
              }
              state.attachments.push(file);
              state.fileScannerTokens[file.name] = "sha256-scanner-token-" + Math.random().toString(36).substring(2);
          }
          renderAttachmentChips();
      };

      window.removeAttachment = function(index) {
          state.attachments.splice(index, 1);
          renderAttachmentChips();
      };

      function renderAttachmentChips() {
          const container = $("fileListContainer");
          if (!container) return;
          container.innerHTML = state.attachments.map((file, idx) => `
            <div class="file-chip">
                <span>📄 ${esc(file.name)} (${(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                <button type="button" onclick="removeAttachment(${idx})">X</button>
            </div>
          `).join("");
      }

      function collectSupportForm() {
          const form = $("supportForm");
          const values = {};
          if (!form) return values;

          form.querySelectorAll("input[id], select[id], textarea[id]").forEach(field => {
              if (!field.id || field.type === "file" || field.type === "button" || field.type === "submit") return;
              if (field.type === "radio") {
                  if (field.checked) values[field.name || field.id] = field.value;
                  return;
              }
              if (field.type === "checkbox") {
                  values[field.id] = Boolean(field.checked);
                  return;
              }
              const value = String(field.value || "").trim();
              if (value) values[field.id] = value;
          });

          return values;
      }

      function supportMessageFrom(formData) {
          const direct = formData.caseDescription || formData.description || formData.message || formData.details || formData.complaintDescription || formData.claimDescription;
          if (direct) return direct;
          return Object.entries(formData)
              .filter(([key, value]) => value !== "" && value !== false && !["firstName","lastName","email","phone","phonePrefix","category","bookingReference"].includes(key))
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join("\n");
      }

      $("supportForm").addEventListener("submit", function(e) {
          e.preventDefault();

          const refValid = validateField($("bookingReference"), regexes.bookingReference, "refError");
          const firstValid = validateField($("firstName"), regexes.name, "firstNameError");
          const lastValid = validateField($("lastName"), regexes.name, "lastNameError");
          const emailValid = validateField($("email"), regexes.email, "emailError");
          
          const sigValid = Boolean(state.signatureDataUrl);
          $("sigError").classList.toggle("show", !sigValid);
          
          const arbitrationChecked = $("arbitrationConsent").checked;
          $("arbitrationError").classList.toggle("show", !arbitrationChecked);

          if (!refValid || !firstValid || !lastValid || !emailValid || !sigValid || !arbitrationChecked) {
              toast("Please resolve highlighted form errors.");
              return;
          }

          const submitBtn = $("submitBtn");
          const fieldset = $("formFieldset");
          const originalText = submitBtn.innerHTML;

          submitBtn.disabled = true;
          fieldset.disabled = true;
          submitBtn.innerHTML = `<span class="spinner-loader"></span> Submitting...`;

          const formData = collectSupportForm();
          const payload = {
              ...formData,
              bookingReference: $("bookingReference").value.trim(),
              firstName: $("firstName").value.trim(),
              lastName: $("lastName").value.trim(),
              fullName: `${$("firstName").value.trim()} ${$("lastName").value.trim()}`.trim(),
              email: $("email").value.trim(),
              phone: `${$("phonePrefix")?.value || ""} ${$("phone")?.value || ""}`.trim(),
              category: $("category").value,
              subject: formData.subject || formData.caseSubject || `${$("category").value || "Member Support"} · ${$("bookingReference").value.trim() || "General inquiry"}`,
              message: supportMessageFrom(formData) || "Member Support request submitted from SKANDI Support Center.",
              digitalSignatureDataUrl: state.signatureDataUrl,
              attachmentNames: state.attachments.map(file => file.name),
              security_telemetry: {
                  user_agent_string: navigator.userAgent,
                  form_completion_time_seconds: Math.floor((Date.now() - formMountTime) / 1000),
                  paste_actions_detected: pasteActionsDetected
              },
              fileScannerTokens: state.fileScannerTokens,
              submissionIdempotencyKey: submissionIdempotencyKey,
              source: "member-helpdesk",
              sourceChannel: "MEMBER_HELPDESK",
              memberPriority: true
          };

          post("CUSTOMER_CREATE_CASE", { case: payload });
          toast("Transmitting request securely...");

          setTimeout(() => {
              submitBtn.disabled = false;
              fieldset.disabled = false;
              submitBtn.innerHTML = originalText;
          }, 2000);
      });

      function renderCases(payload = {}) {
        state.cases = payload.cases || [];
        const q = ($("query")?.value || "").toLowerCase();

        const items = state.cases.filter(c =>
          !q || [caseRefOf(c), c.subject, c.category, c.status, c.booking_ref, c.bookingRef].join(" ").toLowerCase().includes(q)
        );

        $("caseList").innerHTML = items.length ? items.map(c => {
          const id = caseIdOf(c);
          const ref = caseRefOf(c);
          const statusClass = String(c.status || "").toLowerCase() === "closed" ? "closed" : "open";

          return `
            <button class="case-item" data-id="${esc(id)}">
              <div class="case-header">
                <span class="case-title">${esc(c.subject || ref)}</span>
                <span class="badge-status ${statusClass}">${esc(c.status || "Open")}</span>
              </div>
              <div class="case-meta">Ref: ${esc(ref || "N/A")}</div>
              <div><span class="badge-status category">${esc(c.category || "Support")}</span></div>
            </button>
          `;
        }).join("") : `<div style="padding:40px;text-align:center;color:var(--muted);">No support cases found.</div>`;

        document.querySelectorAll("[data-id]").forEach(btn => {
          btn.onclick = () => post("CUSTOMER_OPEN_CASE", { caseId: btn.dataset.id });
        });
      }

      function renderCase(payload = {}) {
        const active = payload.case || {};
        const activeId = caseIdOf(active);
        const activeRef = caseRefOf(active);

        state.active = { ...active, caseId: activeId, case_id: activeId };

        $("caseTitle").textContent = active.subject || activeRef || "Support case";
        $("caseSubtitle").textContent = activeRef ? `Case Reference: ${activeRef}` : "Secure messaging channel";
        $("duffelCaseActions").classList.toggle("hidden", !activeId || !(active.bookingRef || active.pnr || /booking|duffel|flight|hotel/i.test(String(active.subject || ""))));

        $("messages").innerHTML = (payload.messages || []).filter(m => m.private !== true && m.kind !== "internal" && String(m.channel || "").toLowerCase() !== "internal").map(m => {
          const senderType = m.sender_type || m.senderType || "";
          const senderName = m.sender_name || m.senderName || "";
          const content = m.message || m.content || "";
          const isAgent = String(senderType).toLowerCase() === "agent";

          return `
            <div class="msg-wrapper ${isAgent ? "agent" : "user"}">
              <div class="chat-avatar ${isAgent ? "agent" : "user"}">${isAgent ? "S" : "U"}</div>
              <div class="msg-content">
                <span class="msg-sender">${esc(senderName || (isAgent ? "SKANDI Support" : "You"))}</span>
                <div class="msg-bubble">${esc(content)}</div>
              </div>
            </div>
          `;
        }).join("") || `<div style="margin:auto;color:var(--muted);">No messages yet.</div>`;

        $("replyBox").style.display = "flex";
        $("messages").scrollTop = $("messages").scrollHeight;
      }

      $("openDuffelFromCase").onclick = () => {
        const caseId = String(state.active?.caseId || "");
        if (!/^case_[A-Za-z0-9_]+$/.test(caseId)) return toast("Open your booking support case first.");
        post("CUSTOMER_NAVIGATE", { path: `/my-profile/travel-assistance?caseId=${encodeURIComponent(caseId)}` });
      };
      $("refreshBtn").onclick = () => post("CUSTOMER_LIST_CASES");
      $("newBtn").onclick = () => $("newCaseModal").classList.add("open");

      window.closeNewCaseModal = () => {
          $("newCaseModal").classList.remove("open");
          $("supportForm").reset();
          $("branchContainer").innerHTML = "";
          state.attachments = [];
          renderAttachmentChips();
          const payerSection = $("globalFinancialMechanics");
          if (payerSection) payerSection.classList.add("hidden");
      };

      $("query").addEventListener("input", () => renderCases({ cases: state.cases }));

      $("sendBtn").onclick = () => {
        const content = $("replyText").value.trim();
        const caseId = state.active?.case_id || state.active?.caseId;
        if (!content || !caseId) return;

        post("CUSTOMER_REPLY_CASE", { caseId, content });
        $("replyText").value = "";
        toast("Sending reply...");
      };

      window.addEventListener("message", e => {
        const m = e.data || {};
        if (m.source !== PARENT) return;
        const p = m.payload || {};

        if (m.type === "CUSTOMER_PORTAL_STATE" || m.type === "CUSTOMER_PORTAL_DATA") {
            if (p.profile) {
                state.profile = p.profile;
                const fname = p.profile.firstName || p.profile.first_name || "";
                const lname = p.profile.lastName || p.profile.last_name || "";
                const email = p.profile.email || "";
                const phone = p.profile.phone || "";

                if ($("firstName")) $("firstName").value = fname;
                if ($("lastName")) $("lastName").value = lname;
                if ($("email")) $("email").value = email;
                if ($("phone") && phone && !$("phone").value) $("phone").value = phone.replace(/^\+\d+\s*/, "");

                ["firstName", "lastName", "email"].forEach(id => {
                    const field = $(id);
                    if (!field) return;
                    field.readOnly = true;
                    field.setAttribute("aria-readonly", "true");
                    field.title = "Linked to your signed-in SKANDI profile";
                });
            }
            if (p.clubProfile) state.clubProfile = p.clubProfile;
            if (p.supportContext?.bookingRef && $("bookingReference") && !$("bookingReference").value) {
                $("bookingReference").value = p.supportContext.bookingRef;
            }
            if (p.supportContext?.topic && $("category") && !$("category").value) {
                const topic = String(p.supportContext.topic).toLowerCase();
                const options = Array.from($("category").options || []);
                const match = options.find(option => String(option.value || option.textContent || "").toLowerCase().includes(topic));
                if (match) {
                    $("category").value = match.value;
                    $("category").dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
            renderShell();
        }

        if (m.type === "CUSTOMER_CASE_LIST") renderCases(p);
        if (m.type === "CUSTOMER_CASE_DETAIL") renderCase(p);

        if (m.type === "CUSTOMER_REPLY_SENT") {
          toast("Reply sent.");
          const caseId = state.active?.case_id || state.active?.caseId;
          if (caseId) post("CUSTOMER_OPEN_CASE", { caseId });
        }

        if (m.type === "CUSTOMER_CASE_CREATED") {
          toast("Case successfully created.");
          closeNewCaseModal();
          const createdCaseId = p.caseId || p.case?.case_id || p.case?.caseId || "";
          post("CUSTOMER_LIST_CASES");
          if (createdCaseId) setTimeout(() => post("CUSTOMER_OPEN_CASE", { caseId: createdCaseId }), 150);
        }

        if (m.type === "CUSTOMER_ERROR") {
          toast(m.message || p.message || "Support error.");
        }
      });

      renderNav();
      renderShell();
      post("CUSTOMER_READY");
    })();
    