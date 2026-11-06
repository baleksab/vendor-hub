export const VENDORS_PATH = "/vendors";

export const vendorPath = (slug: string) => `${VENDORS_PATH}/${slug}`;

export const productPath = (slug: string, productId: string) =>
  `${vendorPath(slug)}/products/${productId}`;

export const productImagePath = (imageId: string) => `/api/v1/product-images/${imageId}`;
