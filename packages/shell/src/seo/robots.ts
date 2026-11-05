export function buildRobots(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /locale",
    "",
    `Sitemap: ${new URL("/sitemap.xml", origin).toString()}`,
    "",
  ].join("\n");
}
