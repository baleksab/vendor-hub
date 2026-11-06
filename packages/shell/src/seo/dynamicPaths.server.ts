import { listVendors } from "../api/endpoints/vendors.server";
import { searchProducts } from "../api/endpoints/products.server";
import { productPath, vendorPath } from "../vendor/vendorPaths";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export async function collectDynamicPaths(): Promise<string[]> {
  const paths: string[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const vendors = await listVendors({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });

    for (const vendor of vendors.data) {
      paths.push(vendorPath(vendor.slug));
      paths.push(...(await collectProductPaths(vendor.slug)));
    }

    if ((page + 1) * PAGE_SIZE >= vendors.meta.total) {
      break;
    }
  }

  return paths;
}

async function collectProductPaths(slug: string): Promise<string[]> {
  const paths: string[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const products = await searchProducts(slug, { limit: PAGE_SIZE, offset: page * PAGE_SIZE });

    paths.push(...products.data.map((product) => productPath(slug, product.id)));

    if ((page + 1) * PAGE_SIZE >= products.meta.total) {
      break;
    }
  }

  return paths;
}
