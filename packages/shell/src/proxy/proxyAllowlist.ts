const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

type Access = "authenticated" | "public";

type AllowedRoute = { method: string; pattern: RegExp; access: Access; keepCacheControl?: true };

export type ProxiedRoute = Pick<AllowedRoute, "access" | "keepCacheControl">;

const AUTHENTICATED_ROUTES: readonly Omit<AllowedRoute, "access">[] = [
  { method: "GET", pattern: /^\/api\/v1\/countries$/ },
  { method: "GET", pattern: /^\/api\/v1\/users(\/[A-Za-z0-9-]+)?$/ },
  { method: "PATCH", pattern: /^\/api\/v1\/users(\/[A-Za-z0-9-]+)?$/ },
  { method: "GET", pattern: /^\/api\/v1\/vendors\/managed$/ },
  { method: "GET", pattern: new RegExp(`^/api/v1/vendors/${UUID}$`) },
  { method: "PATCH", pattern: new RegExp(`^/api/v1/vendors/${UUID}$`) },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/vendors/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^/api/v1/vendors/${UUID}/operators$`) },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/vendors/${UUID}/operators/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^/api/v1/vendors/${UUID}/products$`) },
  { method: "PATCH", pattern: new RegExp(`^/api/v1/products/${UUID}$`) },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/products/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^/api/v1/products/${UUID}/images$`) },
  { method: "PUT", pattern: new RegExp(`^/api/v1/products/${UUID}/images/order$`) },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/products/${UUID}/images/${UUID}$`) },
  { method: "DELETE", pattern: new RegExp(`^/api/v1/products/${UUID}/reviews/${UUID}$`) },
  { method: "GET", pattern: new RegExp(`^/api/v1/vendors/${UUID}/orders$`) },
  { method: "GET", pattern: new RegExp(`^/api/v1/orders/${UUID}$`) },
  { method: "GET", pattern: /^\/api\/v1\/insights\/vendors$/ },
  { method: "GET", pattern: new RegExp(`^/api/v1/insights/vendors/${UUID}$`) },
  { method: "GET", pattern: new RegExp(`^/api/v1/insights/products/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^/api/v1/orders/${UUID}/deliver$`) },
  { method: "POST", pattern: new RegExp(`^/api/v1/orders/${UUID}/returns/(approve|reject)$`) },
];

const PUBLIC_ROUTES: readonly Omit<AllowedRoute, "access">[] = [
  { method: "GET", pattern: /^\/api\/v1\/categories$/ },
  { method: "GET", pattern: new RegExp(`^/api/v1/products/${UUID}$`) },
  { method: "GET", pattern: new RegExp(`^/api/v1/products/${UUID}/reviews$`) },
  { method: "GET", pattern: /^\/api\/v1\/vendors\/by-slug\/[a-z0-9-]+\/products$/ },
  {
    method: "GET",
    pattern: new RegExp(`^/api/v1/product-images/${UUID}$`),
    keepCacheControl: true,
  },
];

const ALLOWED_ROUTES: readonly AllowedRoute[] = [
  ...AUTHENTICATED_ROUTES.map((route) => ({ ...route, access: "authenticated" as const })),
  ...PUBLIC_ROUTES.map((route) => ({ ...route, access: "public" as const })),
];

export function matchProxied(method: string, pathname: string): ProxiedRoute | undefined {
  return ALLOWED_ROUTES.find((route) => route.method === method && route.pattern.test(pathname));
}

export function isProxied(method: string, pathname: string): boolean {
  return matchProxied(method, pathname) !== undefined;
}
