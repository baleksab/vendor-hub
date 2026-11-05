import { data } from "react-router";

import { ApiError } from "../../api/ApiError";
import { getVendorBySlug } from "../../api/endpoints/vendors.server";
import { createPageMeta } from "../../seo/createMeta";
import { pageMeta, readRootData } from "../../seo/pageMeta";
import { vendorPath } from "../../vendor/vendorPaths";
import type { Route } from "./+types/VendorSite";
import { VendorSiteContent } from "./components/VendorSiteContent";

const DESCRIPTION_MAX = 160;

export async function loader({ params }: Route.LoaderArgs) {
  try {
    return { vendor: await getVendorBySlug(params.slug) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw data(null, { status: 404 });
    }

    throw error;
  }
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
  return <VendorSiteContent vendor={loaderData.vendor} />;
}
