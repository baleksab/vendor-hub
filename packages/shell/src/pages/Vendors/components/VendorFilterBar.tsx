import { Button, Group, NativeSelect, Paper, SimpleGrid, TextInput } from "@mantine/core";
import type { CategoryResponse } from "@vendor-hub/types";
import { Form, Link } from "react-router";

import { useLocale, useT } from "../../../i18n/LocaleProvider";
import {
  VENDOR_MIN_RATING_OPTIONS,
  VENDOR_SORTS,
  type VendorFilters,
} from "../../../vendor/vendorFilters";
import { VENDORS_PATH } from "../../../vendor/vendorPaths";

type Props = {
  filters: VendorFilters;
  categories: CategoryResponse[];
};

export function VendorFilterBar({ filters, categories }: Props) {
  const t = useT();
  const locale = useLocale();
  const filtered = filters.q !== null || filters.category !== null || filters.minRating !== null;
  const sorted = filters.sort !== null;

  const categoryOptions = [
    { value: "", label: t("products.filter.categoryAll") },
    ...categories.map((top) =>
      top.children.length === 0
        ? { value: top.slug, label: top.names[locale] }
        : {
            group: top.names[locale],
            items: [
              { value: top.slug, label: t("vendors.filter.allIn", { name: top.names[locale] }) },
              ...top.children.map((child) => ({ value: child.slug, label: child.names[locale] })),
            ],
          },
    ),
  ];

  return (
    <Paper component="search" withBorder radius="md" p="md">
      <Form method="get">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" verticalSpacing="sm">
          <TextInput
            name="q"
            type="search"
            label={t("vendors.search.label")}
            placeholder={t("vendors.search.placeholder")}
            defaultValue={filters.q ?? ""}
            autoComplete="off"
          />
          <NativeSelect
            name="category"
            label={t("products.filter.category")}
            defaultValue={filters.category ?? ""}
            data={categoryOptions}
          />
          <NativeSelect
            name="minRating"
            label={t("products.filter.rating")}
            defaultValue={String(filters.minRating ?? "")}
            data={[
              { value: "", label: t("products.filter.ratingAny") },
              ...VENDOR_MIN_RATING_OPTIONS.map((stars) => ({
                value: String(stars),
                label: t("products.filter.ratingUp", { stars }),
              })),
            ]}
          />
          <NativeSelect
            name="sort"
            label={t("vendors.sort.label")}
            defaultValue={filters.sort ?? ""}
            data={[
              { value: "", label: t("vendors.sort.newest") },
              ...VENDOR_SORTS.filter((sort) => sort !== "newest").map((sort) => ({
                value: sort,
                label: t(`vendors.sort.${sort}`),
              })),
            ]}
          />
        </SimpleGrid>

        <Group justify="flex-end" mt="md">
          {filtered || sorted ? (
            <Button component={Link} to={VENDORS_PATH} variant="default" mih={44}>
              {t("vendors.filter.reset")}
            </Button>
          ) : (
            <Button variant="default" mih={44} disabled>
              {t("vendors.filter.reset")}
            </Button>
          )}
          <Button type="submit" mih={44}>
            {t("products.filters.apply")}
          </Button>
        </Group>
      </Form>
    </Paper>
  );
}
