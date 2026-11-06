import { Button, Group, List, Stack, Text, Title } from "@mantine/core";
import { StarRating } from "@vendor-hub/ui";
import type {
  CategoryResponse,
  ProductCategoryCountListResponse,
  ProductListResponse,
  PublicVendorResponse,
  ReviewListResponse,
} from "@vendor-hub/types";
import { Link } from "react-router";

import { ReviewSection } from "../../../components/ReviewSection/ReviewSection";
import { useT } from "../../../i18n/LocaleProvider";
import { loginPath } from "../../../auth/safeRedirect";
import { useSession } from "../../../hooks/useSession/useSession";
import type { ProductFilters } from "../../../vendor/products/productFilters";
import { vendorPath } from "../../../vendor/vendorPaths";
import { ProductsTab } from "./ProductsTab";

export type VendorTab = "products" | "reviews" | "about";

export const VENDOR_TABS: readonly VendorTab[] = ["products", "reviews", "about"];

type Props = {
  vendor: PublicVendorResponse;
  tab: VendorTab;
  categories: CategoryResponse[];
  filters: ProductFilters;
  counts: ProductCategoryCountListResponse["data"];
  products: ProductListResponse | null;
  reviews: ReviewListResponse | null;
};

export function VendorSiteContent({
  vendor,
  tab,
  categories,
  filters,
  counts,
  products,
  reviews,
}: Props) {
  const t = useT();
  const { user, vendors } = useSession();
  const base = vendorPath(vendor.slug);
  const isMember =
    vendors?.owned?.slug === vendor.slug ||
    vendors?.operating.some((candidate) => candidate.slug === vendor.slug) === true;

  return (
    <Stack component="section" gap="lg">
      <Stack gap="xs">
        <Title order={1} fz={{ base: 32, sm: 44 }}>
          {vendor.name}
        </Title>
        <Group gap="md">
          <StarRating
            value={vendor.ratingAvg}
            count={vendor.ratingCount}
            label={t("vendorSite.rating", { rating: vendor.ratingAvg.toFixed(1) })}
            size="md"
          />
          <Button
            component={Link}
            to={`${base}?tab=reviews#reviews-vendor`}
            variant="light"
            size="compact-md"
          >
            {t("vendorSite.rateVendor")}
          </Button>
        </Group>
      </Stack>

      <Group component="nav" gap="xs" aria-label={t("vendorSite.tabs")}>
        {VENDOR_TABS.map((candidate) => (
          <Button
            key={candidate}
            component={Link}
            to={candidate === "products" ? base : `${base}?tab=${candidate}`}
            variant={candidate === tab ? "filled" : "subtle"}
            aria-current={candidate === tab ? "page" : undefined}
            mih={44}
          >
            {t(`vendorSite.tab.${candidate}`)}
          </Button>
        ))}
      </Group>

      {tab === "products" && products !== null ? (
        <ProductsTab
          slug={vendor.slug}
          filters={filters}
          categories={categories}
          counts={counts}
          products={products}
        />
      ) : null}

      {tab === "reviews" && reviews !== null ? (
        <ReviewSection
          target="vendor"
          targetId={vendor.id}
          reviews={reviews}
          currentUserId={user?.id ?? null}
          canModerate={user?.role === "administrator" || isMember}
          loginPath={loginPath(`${base}?tab=reviews`)}
        />
      ) : null}

      {tab === "about" ? (
        <Stack gap="lg" maw={720}>
          <Text c="dimmed" fz={{ base: "md", sm: "lg" }} style={{ whiteSpace: "pre-line" }}>
            {vendor.description}
          </Text>

          <Stack gap="xs" component="section" aria-labelledby="vendor-members">
            <Title order={2} id="vendor-members" fz="lg">
              {t("vendor.members")}
            </Title>
            <List listStyleType="none" spacing="xs">
              {vendor.members.map((member) => (
                <List.Item key={`${member.firstName} ${member.lastName} ${member.role}`}>
                  {member.firstName} {member.lastName}{" "}
                  <Text span c="dimmed">
                    ({t(member.role === "owner" ? "vendor.role.owner" : "vendor.role.operator")})
                  </Text>
                </List.Item>
              ))}
            </List>
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}
