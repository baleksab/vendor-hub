export const VENDORS_PATH = "/manage/vendors";

export const vendorPath = (id: string) => `${VENDORS_PATH}/${id}`;

export const insightsVendorPath = (id: string) => `/insights/vendors/${id}`;

export const insightsProductPath = (vendorId: string, productId: string) =>
  `${insightsVendorPath(vendorId)}/products/${productId}`;

export const BECOME_VENDOR_PATH = "/become-vendor";

export const vendorSitePath = (slug: string) => `/vendors/${slug}`;

export const productsPath = (vendorId: string) => `${vendorPath(vendorId)}/products`;

export const newProductPath = (vendorId: string) => `${productsPath(vendorId)}/new`;

export const productPath = (vendorId: string, productId: string) =>
  `${productsPath(vendorId)}/${productId}`;

export const productImagePath = (imageId: string) => `/api/v1/product-images/${imageId}`;

export const ordersPath = (vendorId: string) => `${vendorPath(vendorId)}/orders`;

export const orderPath = (vendorId: string, orderId: string) =>
  `${ordersPath(vendorId)}/${orderId}`;
