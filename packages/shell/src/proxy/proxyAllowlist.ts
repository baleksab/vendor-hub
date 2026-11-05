const USERS_PATH = /^\/api\/v1\/users(\/[A-Za-z0-9-]+)?$/;
const COUNTRIES_PATH = "/api/v1/countries";

const ALLOWED_METHODS = new Set(["GET", "PATCH"]);

export function isProxied(method: string, pathname: string): boolean {
  if (method === "GET" && pathname === COUNTRIES_PATH) {
    return true;
  }

  return ALLOWED_METHODS.has(method) && USERS_PATH.test(pathname);
}
