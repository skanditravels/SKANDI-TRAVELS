// Employee-scoped transport lookup. The caller must first authenticate the
// staff session and pass identifiers taken only from that trusted session.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STAFF_ID = /^[A-Za-z0-9_-]{1,160}$/;
const rowsOf = value => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
const upper = value => String(value ?? '').trim().toUpperCase();
const text = value => String(value ?? '').trim();

/**
 * Load only services for which a staff identifier has an active membership.
 * Missing storage or provider errors propagate: an empty result is not a
 * substitute for an unavailable roster source.
 */
export async function loadOwnedBusServices({identifiers, restRequest, select, limit = 300} = {}) {
  if (typeof restRequest !== 'function' || typeof select !== 'string' || !select) throw new Error('OPS_TRANSPORT_ROSTER_CONFIG_INVALID');
  const ids=[...new Set((Array.isArray(identifiers)?identifiers:[]).map(text).filter(x=>STAFF_ID.test(x)))];
  if (!ids.length) throw new Error('OPS_TRANSPORT_ROSTER_ID_REQUIRED');
  const allowed=new Set(ids.map(upper)), byService=new Map();
  for(const id of ids) {
    const links=[];let offset=0;
    const pageSize=Math.max(1,Math.min(1000,Number(limit)||300));
    for (;;) {
      const page=rowsOf(await restRequest({table:'ops_transport_staff',method:'GET',query:{select:'service_id,employee_id,role,status',employee_id:'eq.'+id,status:'in.(SCHEDULED,CONFIRMED)',order:'service_id.asc,role.asc',limit:String(pageSize),offset:String(offset)}}));
      links.push(...page);
      if(page.length<pageSize)break;
      offset+=page.length;
    }
    for(const link of links) {
      const serviceId=text(link.service_id),employeeId=text(link.employee_id);
      if(!UUID.test(serviceId)||!allowed.has(upper(employeeId))||!['SCHEDULED','CONFIRMED'].includes(upper(link.status)))continue;
      if(!byService.has(serviceId))byService.set(serviceId,{employeeId,roles:new Set()});
      byService.get(serviceId).roles.add(upper(link.role));
    }
  }
  const output=[];
  for(const [serviceId,membership] of byService) {
    const source=rowsOf(await restRequest({table:'vehicle_assignments',method:'GET',query:{select,id:'eq.'+serviceId,limit:'1'}}));
    const row=source.find(value=>text(value.id).toLowerCase()===serviceId.toLowerCase());
    const payload=row?.payload && typeof row.payload==='object' && !Array.isArray(row.payload)?row.payload:{};
    if(!row||payload.kind!=='BUS'||payload.opsTransportVersion!==2||!['SCHEDULED','CONFIRMED'].includes(upper(row.status)))continue;
    // Present the authorized membership as the owner to existing clock/request
    // checks without modifying the underlying shared service record.
    const safePayload={};
    for(const key of ['kind','opsTransportVersion','label','activityType','vehicleName','registration','seatCapacity','passengerCount','stops','baseCode','routeLabel','timeZone']) {
      if(Object.hasOwn(payload,key))safePayload[key]=payload[key];
    }
    safePayload.staffRoles=[...membership.roles];
    output.push({...row,employee_id:membership.employeeId,employee_ref:null,payload:safePayload});
  }
  return output;
}
