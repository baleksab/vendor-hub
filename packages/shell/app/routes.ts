import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("locale", "routes/locale.ts"),
  route("remote-test", "routes/remote-test.tsx"),
] satisfies RouteConfig;
