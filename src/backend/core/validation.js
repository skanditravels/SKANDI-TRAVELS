export function requireValue(value, name) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export function optionalText(value) {
  return String(value || "").trim();
}

export function emailOrEmpty(value) {
  const email = optionalText(value).toLowerCase();
  if (!email) return "";
  if (!email.includes("@")) throw new Error("Invalid email address.");
  return email;
}
