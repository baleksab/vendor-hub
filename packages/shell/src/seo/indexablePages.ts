export const indexablePages = [
  { path: "/", page: "Home" },
  { path: "/vendors", page: "Vendors" },
] as const;

export const indexablePaths = indexablePages.map((entry) => entry.path);
