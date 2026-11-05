import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("pages/Home/Home.tsx"),
  route("remote-test", "pages/RemoteTest/RemoteTest.tsx"),
  route("login", "pages/Login/Login.tsx"),
  route("register", "pages/Register/Register.tsx"),
  route("auth/login", "routes/auth.login.ts"),
  route("auth/logout", "routes/auth.logout.ts"),
  route("api/*", "routes/api.proxy.ts"),
  route("locale", "routes/locale.ts"),
  route("robots.txt", "routes/robots.txt.ts"),
  route("sitemap.xml", "routes/sitemap.xml.ts"),
  route("*", "pages/NotFound/NotFound.tsx"),
] satisfies RouteConfig;
