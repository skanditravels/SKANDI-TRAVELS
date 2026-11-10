// Staff-only assignment sources shared by OPS Control, MyRoster, and EOS.
const operationalSelect = "id,employee_id,start_time,end_time,status,payload,route_id,booking_reference,notes,created_at,updated_at";

export const ROSTER_ASSIGNMENT_SOURCES = Object.freeze({
  roster_shifts: {
    select: operationalSelect + ",employee_ref,start_at,end_at,location,assignment_type",
    ownerColumns: ["employee_id", "employee_ref"]
  },
  crew_assignments: {
    select: operationalSelect + ",employee_ref,start_at,end_at,assignment,route",
    ownerColumns: ["employee_id", "employee_ref"]
  },
  driver_assignments: { select: operationalSelect, ownerColumns: ["employee_id"] },
  tour_assignments: { select: operationalSelect, ownerColumns: ["employee_id"] },
  airport_duty_assignments: { select: operationalSelect, ownerColumns: ["employee_id"] },
  vehicle_assignments: { select: operationalSelect, ownerColumns: ["employee_id"] }
});

export function rosterAssignmentLabel(row, payload) {
  return payload.label || payload.title || payload.assignmentName || row.assignment ||
    payload.assignment || row.assignment_type || row.route || row.route_id ||
    row.booking_reference || payload.routeLabel || payload.reference || "";
}

export function rosterAssignmentTimes(row, payload) {
  return {
    start: row.start_at || row.start_time || payload.start_at || payload.startAt || payload.start_time || payload.startTime || "",
    end: row.end_at || row.end_time || payload.end_at || payload.endAt || payload.end_time || payload.endTime || ""
  };
}

// Draft transport services are visible to OPS only.
export function rosterAssignmentVisible(row, table) {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  return !(table === "vehicle_assignments" && payload.kind === "BUS" && payload.opsTransportVersion === 1 && String(row.status || "").toUpperCase() === "DRAFT");
}

export function rosterTransportDetails(row, payload) {
  if (payload?.kind !== "BUS" || payload?.opsTransportVersion !== 1) return null;
  const clean = (value, max = 180) => String(value ?? "").trim().slice(0, max);
  const number = value => value !== null && value !== undefined && value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  return {
    vehicleName: clean(payload.vehicleName, 160), registration: clean(payload.registration, 40),
    seatCapacity: number(payload.seatCapacity), passengerCount: number(payload.passengerCount),
    stops: (Array.isArray(payload.stops) ? payload.stops : []).slice(0, 20).map(value => clean(value)).filter(Boolean)
  };
}
