export function appError(message, code = "APP_ERROR", status = 400, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

export function notFound(message = "Not found.") {
  return appError(message, "NOT_FOUND", 404);
}

export function forbidden(message = "Forbidden.") {
  return appError(message, "FORBIDDEN", 403);
}

export function badRequest(message = "Bad request.", details = {}) {
  return appError(message, "BAD_REQUEST", 400, details);
}
