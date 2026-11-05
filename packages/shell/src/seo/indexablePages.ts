export const indexablePages = [
  { path: "/", page: "Home" },
  { path: "/vendors", page: "Vendors" },
  { path: "/remote-test", page: "RemoteTest" },
] as const;

export const indexablePaths = indexablePages.map((entry) => entry.path);
