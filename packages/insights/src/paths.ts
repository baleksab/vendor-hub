export const INSIGHTS_PATH = "/insights/vendors";

export const insightsVendorPath = (id: string) => `${INSIGHTS_PATH}/${id}`;

export const insightsProductPath = (vendorId: string, productId: string) =>
  `${insightsVendorPath(vendorId)}/products/${productId}`;

export const manageVendorPath = (id: string) => `/manage/vendors/${id}`;

export const manageProductPath = (vendorId: string, productId: string) =>
  `${manageVendorPath(vendorId)}/products/${productId}`;

export const vendorSitePath = (slug: string) => `/vendors/${slug}`;

export const BECOME_VENDOR_PATH = "/become-vendor";
