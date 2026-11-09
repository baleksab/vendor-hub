import { Button, Group, Stack, Title } from "@mantine/core";
import { Link, redirect } from "react-router";

import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import { hasInsights, INSIGHTS_PATH } from "../../vendor/insightsLink";
import { MANAGE_VENDORS_PATH, manageVendorsLabelKey } from "../../vendor/manageVendorsLink";
import { VENDORS_PATH } from "../../vendor/vendorPaths";
import { listCategories } from "../../api/endpoints/products.server";
import { categorySlugs } from "../../vendor/products/categoryNames";
import { parseVendorFilters, toVendorSearchParams } from "../../vendor/vendorFilters";
import { loadVendorPage } from "../../vendor/vendorList.server";
import type { Route } from "./+types/Vendors";
import { VendorFilterBar } from "./components/VendorFilterBar";
import { VendorList } from "./components/VendorList";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { data: categories } = await listCategories();
    const filters = parseVendorFilters(
      new URL(request.url).searchParams,
      categorySlugs(categories),
    );
    const vendors = await loadVendorPage(filters);

    if (filters.page > vendors.pageCount) {
      const last = toVendorSearchParams({ ...filters, page: vendors.pageCount }).toString();

      throw redirect(last === "" ? VENDORS_PATH : `${VENDORS_PATH}?${last}`);
    }

    return { vendors, categories, filters };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    return {
      vendors: null,
      categories: [],
      filters: parseVendorFilters(new URL(request.url).searchParams, new Set<string>()),
    };
  }
}

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.vendors.title",
    descriptionKey: "seo.vendors.description",
    path: VENDORS_PATH,
  });
}

export default function Vendors({ loaderData }: Route.ComponentProps) {
  const t = useT();
  const { user, vendors } = useSession();
  const manageLabelKey = manageVendorsLabelKey(user, vendors);
  const { filters } = loaderData;
  const filtered = filters.q !== null || filters.category !== null || filters.minRating !== null;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <Title order={1}>{t("vendors.title")}</Title>
        <Group gap="sm">
          {hasInsights(vendors) ? (
            <Button component={Link} to={INSIGHTS_PATH} variant="default" mih={44}>
              {t("vendors.insights")}
            </Button>
          ) : null}
          {manageLabelKey === null ? null : (
            <Button component={Link} to={MANAGE_VENDORS_PATH} mih={44}>
              {t(manageLabelKey)}
            </Button>
          )}
        </Group>
      </Group>
      <VendorFilterBar filters={loaderData.filters} categories={loaderData.categories} />
      <VendorList
        vendors={loaderData.vendors}
        categories={loaderData.categories}
        filters={loaderData.filters}
        filtered={filtered}
      />
    </Stack>
  );
}
