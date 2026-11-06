export const VENDORS_PATH = "/manage/vendors";

export const vendorPath = (id: string) => `${VENDORS_PATH}/${id}`;

export const BECOME_VENDOR_PATH = "/become-vendor";

export const vendorSitePath = (slug: string) => `/vendors/${slug}`;

export const productsPath = (vendorId: string) => `${vendorPath(vendorId)}/products`;

export const newProductPath = (vendorId: string) => `${productsPath(vendorId)}/new`;

export const productPath = (vendorId: string, productId: string) =>
  `${productsPath(vendorId)}/${productId}`;

export const productImagePath = (imageId: string) => `/api/v1/product-images/${imageId}`;
