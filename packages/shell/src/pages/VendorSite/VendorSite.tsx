import { data } from "react-router";

import { ApiError } from "@vendor-hub/api-client";
import {
  listCategories,
  listProductCategoryCounts,
  searchProducts,
} from "../../api/endpoints/products.server";
import { listVendorReviews } from "../../api/endpoints/reviews.server";
import { getVendorBySlug } from "../../api/endpoints/vendors.server";
import { reviewAction } from "../../reviews/reviewAction.server";
import { categorySlugs } from "../../vendor/products/categoryNames";
import {
  parseProductFilters,
  toApiQuery,
  toSharedApiQuery,
} from "../../vendor/products/productFilters";
import { createPageMeta } from "../../seo/createMeta";
import { pageMeta, readRootData } from "../../seo/pageMeta";
import { vendorPath } from "../../vendor/vendorPaths";
import type { Route } from "./+types/VendorSite";
import { VENDOR_TABS, VendorSiteContent, type VendorTab } from "./components/VendorSiteContent";

const DESCRIPTION_MAX = 160;
const REVIEWS_LIMIT = 50;

function readTab(value: string | null): VendorTab {
  return VENDOR_TABS.find((tab) => tab === value) ?? "products";
}

export async function loader({ params, request }: Route.LoaderArgs) {
  try {
    const vendor = await getVendorBySlug(params.slug);
    const searchParams = new URL(request.url).searchParams;
    const tab = readTab(searchParams.get("tab"));
    const { data: categories } = await listCategories();
    const filters = parseProductFilters(searchParams, categorySlugs(categories));

    if (tab === "products") {
      const [products, counts] = await Promise.all([
        searchProducts(params.slug, toApiQuery(filters)),
        listProductCategoryCounts(params.slug, toSharedApiQuery(filters)),
      ]);

      return { vendor, tab, categories, filters, products, counts: counts.data, reviews: null };
    }

    const reviews =
      tab === "reviews"
        ? await listVendorReviews(params.slug, { limit: REVIEWS_LIMIT, offset: 0 })
        : null;

    return { vendor, tab, categories, filters, products: null, counts: [], reviews };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw data(null, { status: 404 });
    }

    throw error;
  }
}

export function action({ request }: Route.ActionArgs) {
  return reviewAction(request);
}

export function meta({ matches, loaderData, params }: Route.MetaArgs) {
  const vendor = loaderData?.vendor;
  const root = readRootData(matches);

  if (vendor && root) {
    return createPageMeta({
      title: vendor.name,
      description: vendor.description.slice(0, DESCRIPTION_MAX),
      path: vendorPath(params.slug),
      origin: root.origin,
      locale: root.locale,
      siteName: vendor.name,
    });
  }

  return pageMeta(matches, {
    titleKey: "seo.notFound.title",
    descriptionKey: "seo.notFound.description",
    path: vendorPath(params.slug),
    noindex: true,
  });
}

export default function VendorSite({ loaderData }: Route.ComponentProps) {
  return <VendorSiteContent {...loaderData} />;
}
