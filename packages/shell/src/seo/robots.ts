export function buildRobots(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /locale",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /orders",
    "",
    `Sitemap: ${new URL("/sitemap.xml", origin).toString()}`,
    "",
  ].join("\n");
}
