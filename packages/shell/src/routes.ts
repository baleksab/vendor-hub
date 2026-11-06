import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("pages/Home/Home.tsx"),
  route("vendors", "pages/Vendors/Vendors.tsx"),
  route("vendors/:slug", "pages/VendorSite/VendorSite.tsx"),
  route("login", "pages/Login/Login.tsx"),
  route("register", "pages/Register/Register.tsx"),
  route("become-vendor", "pages/BecomeVendor/BecomeVendor.tsx"),
  route("logout", "routes/logout.ts"),
  route("locale", "routes/locale.ts"),
  route("robots.txt", "routes/robots.txt.ts"),
  route("sitemap.xml", "routes/sitemap.xml.ts"),
  route("admin/*", "pages/Admin/Admin.tsx"),
  route("manage/*", "pages/ManageVendors/ManageVendors.tsx"),
  route("api/v1/*", "routes/apiProxy.ts"),
  route("*", "pages/NotFound/NotFound.tsx"),
] satisfies RouteConfig;
