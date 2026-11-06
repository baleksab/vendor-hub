const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

type AllowedRoute = { method: string; pattern: RegExp };

const ALLOWED_ROUTES: readonly AllowedRoute[] = [
  { method: "GET", pattern: /^\/api\/v1\/countries$/ },
  { method: "GET", pattern: /^\/api\/v1\/users(\/[A-Za-z0-9-]+)?$/ },
  { method: "PATCH", pattern: /^\/api\/v1\/users(\/[A-Za-z0-9-]+)?$/ },
  { method: "GET", pattern: /^\/api\/v1\/vendors\/managed$/ },
  { method: "GET", pattern: new RegExp(`^/api/v1/vendors/${UUID}$`) },
  { method: "PATCH", pattern: new RegExp(`^/api/v1/vendors/${UUID}$`) },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/vendors/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^/api/v1/vendors/${UUID}/operators$`) },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/vendors/${UUID}/operators/${UUID}$`) },
];

export function isProxied(method: string, pathname: string): boolean {
  return ALLOWED_ROUTES.some((route) => route.method === method && route.pattern.test(pathname));
}
