import { Button, Group, Radio, Stack, Switch, Text, TextInput } from "@mantine/core";
import type { CategoryResponse, ProductCategoryCountListResponse } from "@vendor-hub/types";
import { Form, Link } from "react-router";

import { useLocale, useT } from "../../../i18n/LocaleProvider";
import { MIN_RATING_OPTIONS, type ProductFilters } from "../../../vendor/products/productFilters";

type Props = {
  filters: ProductFilters;
  categories: CategoryResponse[];
  counts: ProductCategoryCountListResponse["data"];
  clearHref: string;
  idPrefix: string;
  onSubmit?: () => void;
};

export function ProductFilterForm({
  filters,
  categories,
  counts,
  clearHref,
  idPrefix,
  onSubmit,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const countOf = (slug: string) => counts.find((entry) => entry.category === slug)?.count ?? 0;

  const groups = categories
    .map((top) => ({
      top,
      children: top.children.filter(
        (child) => countOf(child.slug) > 0 || child.slug === filters.category,
      ),
      total: top.children.reduce((sum, child) => sum + countOf(child.slug), 0) + countOf(top.slug),
    }))
    .filter(({ top, total }) => total > 0 || top.slug === filters.category);

  return (
    <Form method="get" onSubmit={onSubmit}>
      <Stack gap="lg">
        {filters.q === null ? null : <input type="hidden" name="q" value={filters.q} />}
        {filters.sort === null ? null : <input type="hidden" name="sort" value={filters.sort} />}

        <Radio.Group
          name="category"
          label={t("products.filter.category")}
          defaultValue={filters.category ?? ""}
        >
          <Stack gap={6} mt={6}>
            <Radio value="" label={t("products.filter.categoryAll")} />
            {groups.map(({ top, children, total }) => (
              <Stack key={top.slug} gap={4}>
                <Radio
                  value={top.slug}
                  label={`${top.names[locale]} (${total})`}
                  styles={{ label: { fontWeight: 600 } }}
                />
                {children.map((child) => (
                  <Radio
                    key={child.slug}
                    ml="lg"
                    value={child.slug}
                    label={`${child.names[locale]} (${countOf(child.slug)})`}
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        </Radio.Group>

        <Radio.Group
          name="minRating"
          label={t("products.filter.rating")}
          defaultValue={String(filters.minRating ?? "")}
        >
          <Stack gap={6} mt={6}>
            <Radio value="" label={t("products.filter.ratingAny")} />
            {MIN_RATING_OPTIONS.map((stars) => (
              <Radio
                key={stars}
                value={String(stars)}
                label={t("products.filter.ratingUp", { stars })}
              />
            ))}
          </Stack>
        </Radio.Group>

        <Stack gap={6}>
          <Text size="sm" fw={500}>
            {t("products.filter.price")}
          </Text>
          <Group grow gap="xs">
            <TextInput
              id={`${idPrefix}-minPrice`}
              name="minPrice"
              type="number"
              min={0}
              inputMode="numeric"
              aria-label={t("products.filter.minPrice")}
              placeholder={t("products.filter.minPrice")}
              defaultValue={filters.minPrice ?? ""}
            />
            <TextInput
              id={`${idPrefix}-maxPrice`}
              name="maxPrice"
              type="number"
              min={0}
              inputMode="numeric"
              aria-label={t("products.filter.maxPrice")}
              placeholder={t("products.filter.maxPrice")}
              defaultValue={filters.maxPrice ?? ""}
            />
          </Group>
        </Stack>

        <Switch
          name="inStock"
          value="true"
          label={t("products.filter.inStock")}
          defaultChecked={filters.inStock}
        />

        <Group>
          <Button type="submit" mih={44}>
            {t("products.filters.apply")}
          </Button>
          <Button component={Link} to={clearHref} variant="subtle" mih={44}>
            {t("products.filters.clear")}
          </Button>
        </Group>
      </Stack>
    </Form>
  );
}
