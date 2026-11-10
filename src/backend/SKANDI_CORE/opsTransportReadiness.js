// Pure operational decision rules. A caller must authenticate actors, load
// canonical records and persist/dispatch the result; this module sends nothing.
const ACTIVE_SERVICE = new Set(['SCHEDULED','CONFIRMED']);
const ACTIVE_STAFF = new Set(['SCHEDULED','CONFIRMED']);
const str = value => String(value ?? '').trim();
const code = value => str(value).toUpperCase();
const add = (list, key, severity, message, action) => list.push({key,severity,message,action});

/**
 * Assess a single bus service at the supplied instant.
 * Inputs are trusted server projections, never direct browser-supplied claims.
 * Acknowledgment must be persisted and authorized by the calling service.
 */
export function evaluateTransportReadiness(service, now = Date.now()) {
  const s = service && typeof service === 'object' ? service : {};
  const instant = now instanceof Date ? now.getTime() : Number(now);
  const start = Date.parse(s.startAt || '');
  const type = code(s.operatorType), status = code(s.status);
  if (!Number.isFinite(instant) || !Number.isFinite(start) || !['OWN','THIRD_PARTY'].includes(type)) {
    return {valid:false,issues:[],noticeEligible:false};
  }
  if (!ACTIVE_SERVICE.has(status)) return {valid:true,issues:[],noticeEligible:false};
  const staff = (Array.isArray(s.staff) ? s.staff : []).filter(row => row && ACTIVE_STAFF.has(code(row.status)) && str(row.staffId));
  const drivers = staff.filter(row => code(row.role)==='DRIVER');
  const hosts = staff.filter(row => code(row.role)==='HOST');
  const approval = s.noHostApproval && typeof s.noHostApproval === 'object' ? s.noHostApproval : {};
  const approved = type==='OWN' && hosts.length===0 && str(approval.approvedBy) && str(approval.approvedAt) && str(approval.serviceRevision) && str(approval.serviceRevision)===str(s.revision);
  const provider = s.provider && typeof s.provider === 'object' ? s.provider : {};
  const issues = [];
  const msUntilStart = start-instant;
  // Keep unresolved issues visible after the scheduled start until an operator
  // resolves or closes the service; missed departures are not silently cleared.
  const within = hours => msUntilStart <= hours*3600000;
  if (type==='OWN') {
    if (!hosts.length && !approved) add(issues,'OWN_HOST_APPROVAL_REQUIRED','warning','No SKANDI Host is scheduled. OPS must approve operating without a Host.','Schedule a Host or explicitly approve no Host.');
    if (!drivers.length) {
      if (within(2)) add(issues,'OWN_DRIVER_MISSING_2H','urgent','No driver is scheduled and departure is within two hours or overdue.','Call an available standby driver immediately.');
      else add(issues,'OWN_DRIVER_REQUIRED','warning','No driver is scheduled.','Schedule a driver before departure.');
    }
  } else {
    const missing = [];
    if (!str(provider.supplierId)) missing.push('supplier identity');
    if (!str(provider.driverName)) missing.push('driver information');
    if (!str(provider.vehicleRegistration) || !str(provider.vehicleDescription)) missing.push('vehicle information');
    if (missing.length && within(4)) add(issues,'SUPPLIER_DETAILS_MISSING_4H','urgent',`Supplier has not provided ${missing.join(' and ')}.`,'Contact the supplier immediately; departure is within four hours or overdue.');
    else if (missing.length) add(issues,'SUPPLIER_DETAILS_PENDING','warning',`Supplier has not provided ${missing.join(' and ')}.`,'Obtain the missing details from the supplier.');
    if (!hosts.length) {
      if (within(2)) add(issues,'THIRD_PARTY_HOST_MISSING_2H','urgent','No SKANDI Host is scheduled and departure is within two hours or overdue.','Call an available standby Host immediately.');
      else add(issues,'THIRD_PARTY_HOST_REQUIRED','warning','No SKANDI Host is scheduled.','Schedule a SKANDI Host before departure.');
    }
  }
  // Eligibility only says that the reviewed staffing condition is true. It
  // does not authorize a send: a caller must verify service/booking linkage,
  // recipients, approval rights, delivery state and the current service again.
  return {valid:true,issues,driverCount:drivers.length,hostCount:hosts.length,noHostApproved:!!approved,noticeEligible:!!approved && msUntilStart>=0};
}
