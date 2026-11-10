export const DESCRIPTION_MAX = 160;

type VendorSeoSource = {
  name: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type ProductSeoSource = {
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImageId?: string | null;
  images: { id: string }[];
};

function customOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed === "" ? null : trimmed;
}

function fallbackDescription(description: string): string {
  return description.slice(0, DESCRIPTION_MAX);
}

export function resolveVendorSeo(vendor: VendorSeoSource): { title: string; description: string } {
  return {
    title: customOrNull(vendor.seoTitle) ?? vendor.name,
    description: customOrNull(vendor.seoDescription) ?? fallbackDescription(vendor.description),
  };
}

export function resolveProductSeo(
  product: ProductSeoSource,
  fallbackTitle: string,
): { title: string; description: string; imageId: string | undefined } {
  const chosen = product.images.find((image) => image.id === product.seoImageId);

  return {
    title: customOrNull(product.seoTitle) ?? fallbackTitle,
    description: customOrNull(product.seoDescription) ?? fallbackDescription(product.description),
    imageId: (chosen ?? product.images[0])?.id,
  };
}
