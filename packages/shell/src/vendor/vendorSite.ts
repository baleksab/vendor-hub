const SLUG_PLACEHOLDER = "{slug}";

export function vendorSiteOrigin(template: string, slug: string): string {
  return new URL(template.replace(SLUG_PLACEHOLDER, slug)).origin;
}

export function readVendorSlug(request: Request, headerName: string): string | null {
  const value = request.headers.get(headerName)?.trim().toLowerCase();

  return value === undefined || value === "" ? null : value;
}
