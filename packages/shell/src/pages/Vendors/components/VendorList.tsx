import { Alert, Pagination, SimpleGrid, Stack, Text } from "@mantine/core";
import { EmptyState } from "@vendor-hub/ui";
import type { CategoryResponse } from "@vendor-hub/types";
import { Link } from "react-router";

import { useT } from "../../../i18n/LocaleProvider";
import { toVendorSearchParams, type VendorFilters } from "../../../vendor/vendorFilters";
import type { VendorPage } from "../../../vendor/vendorList.server";
import { VENDORS_PATH } from "../../../vendor/vendorPaths";
import { VendorCard } from "./VendorCard";

type Props = {
  vendors: VendorPage | null;
  categories: CategoryResponse[];
  filters: VendorFilters;
  filtered: boolean;
};

export function VendorList({ vendors, categories, filters, filtered }: Props) {
  const t = useT();

  const pagePath = (page: number) => {
    const query = toVendorSearchParams({ ...filters, page }).toString();

    return query === "" ? VENDORS_PATH : `${VENDORS_PATH}?${query}`;
  };

  if (vendors === null) {
    return (
      <Alert color="red" role="alert">
        {t("vendors.error")}
      </Alert>
    );
  }

  return (
    <Stack component="section" gap="md">
      <Text size="sm" c="dimmed" aria-live="polite">
        {t("vendors.count", { count: vendors.total })}
      </Text>

      {vendors.items.length === 0 ? (
        <EmptyState title={filtered ? t("vendors.emptyFiltered") : t("vendors.empty")} />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {vendors.items.map((vendor) => (
            <VendorCard key={vendor.slug} vendor={vendor} categories={categories} />
          ))}
        </SimpleGrid>
      )}

      {vendors.pageCount > 1 && (
        <Pagination
          total={vendors.pageCount}
          value={vendors.page}
          aria-label={t("vendors.pagination")}
          getItemProps={(page) => ({ component: Link, to: pagePath(page) })}
          getControlProps={(control) => {
            const target =
              control === "first"
                ? 1
                : control === "last"
                  ? vendors.pageCount
                  : control === "next"
                    ? vendors.page + 1
                    : vendors.page - 1;

            return { component: Link, to: pagePath(target) };
          }}
        />
      )}
    </Stack>
  );
}
