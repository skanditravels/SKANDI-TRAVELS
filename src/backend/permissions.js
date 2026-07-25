export function isStaffEmail(email = "") {
  const value = String(email || "").toLowerCase();
  return value.endsWith("@skanditravels.com") || value.endsWith("@skandi.travel");
}

export function requireStaffContext(ctx) {
  if (!ctx?.email || !isStaffEmail(ctx.email)) {
    const error = new Error("FORBIDDEN");
    error.code = "FORBIDDEN";
    throw error;
  }

  return true;
}

export function canManageCustomer(ctx) {
  return isStaffEmail(ctx?.email);
}

export function canAdjustPoints(ctx) {
  return isStaffEmail(ctx?.email);
}