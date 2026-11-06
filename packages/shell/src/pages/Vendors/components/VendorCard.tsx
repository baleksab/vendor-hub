import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { StarRating } from "@vendor-hub/ui";
import type { CategoryResponse, VendorListItemResponse } from "@vendor-hub/types";
import { Link } from "react-router";

import { useLocale, useT } from "../../../i18n/LocaleProvider";
import { categoryName } from "../../../vendor/products/categoryNames";
import { vendorPath } from "../../../vendor/vendorPaths";

const DESCRIPTION_LINES = 3;
const VISIBLE_CATEGORIES = 3;

type Props = {
  vendor: VendorListItemResponse;
  categories: CategoryResponse[];
};

export function VendorCard({ vendor, categories }: Props) {
  const t = useT();
  const locale = useLocale();
  const visible = vendor.categories.slice(0, VISIBLE_CATEGORIES);
  const hidden = vendor.categories.length - visible.length;

  return (
    <Card
      component={Link}
      to={vendorPath(vendor.slug)}
      withBorder
      padding="md"
      radius="md"
      h="100%"
    >
      <Stack gap="sm" h="100%">
        <Stack gap={4}>
          <Text fw={600} fz="lg" lineClamp={1}>
            {vendor.name}
          </Text>
          <Group gap="xs" wrap="nowrap">
            <StarRating
              value={vendor.ratingAvg}
              count={vendor.ratingCount}
              label={t("vendorSite.rating", { rating: vendor.ratingAvg.toFixed(1) })}
            />
            <Text size="xs" c="dimmed">
              {"· "}
              {t("vendors.productCount", { count: vendor.productCount })}
            </Text>
          </Group>
        </Stack>

        <Text c="dimmed" size="sm" lineClamp={DESCRIPTION_LINES}>
          {vendor.description}
        </Text>

        <Group gap={6} mt="auto" aria-label={t("vendors.sells")}>
          {visible.length === 0 ? (
            <Text size="xs" c="dimmed">
              {t("vendors.noProducts")}
            </Text>
          ) : null}
          {visible.map((slug) => (
            <Badge key={slug} variant="light" tt="none" fw={500}>
              {categoryName(categories, slug, locale)}
            </Badge>
          ))}
          {hidden > 0 ? (
            <Badge variant="default" tt="none" fw={500}>
              +{hidden}
            </Badge>
          ) : null}
        </Group>
      </Stack>
    </Card>
  );
}
