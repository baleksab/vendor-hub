import { Button, Group, List, Stack, Tabs, Text, Title } from "@mantine/core";
import { BackLink, StarRating } from "@vendor-hub/ui";
import type {
  CategoryResponse,
  ProductCategoryCountListResponse,
  ProductListResponse,
  PublicVendorResponse,
  ReviewListResponse,
} from "@vendor-hub/types";
import { Link, useNavigate } from "react-router";

import { ReviewSection } from "../../../components/ReviewSection/ReviewSection";
import { useT } from "../../../i18n/LocaleProvider";
import { loginPath } from "../../../auth/safeRedirect";
import { useSession } from "../../../hooks/useSession/useSession";
import type { ProductFilters } from "../../../vendor/products/productFilters";
import { insightsVendorPath } from "../../../vendor/insightsLink";
import { manageVendorPath } from "../../../vendor/manageVendorsLink";
import { VENDORS_PATH, vendorPath } from "../../../vendor/vendorPaths";
import { ProductsTab } from "./ProductsTab";

export type VendorTab = "products" | "about" | "reviews";

export const VENDOR_TABS: readonly VendorTab[] = ["products", "about", "reviews"];

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
  const navigate = useNavigate();
  const { user, vendors } = useSession();
  const base = vendorPath(vendor.slug);
  const isMember =
    vendors?.owned?.slug === vendor.slug ||
    vendors?.operating.some((candidate) => candidate.slug === vendor.slug) === true;
  const canManage = user?.role === "administrator" || isMember;

  return (
    <Stack component="section" gap="lg">
      <BackLink to={VENDORS_PATH} label={t("vendorSite.back")} linkComponent={Link} />

      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap" gap="md">
          <Title order={1} fz={{ base: 32, sm: 44 }}>
            {vendor.name}
          </Title>
          {canManage || isMember ? (
            <Group gap="sm" wrap="wrap" justify="flex-end">
              {isMember ? (
                <Button
                  component={Link}
                  to={insightsVendorPath(vendor.id)}
                  variant="default"
                  mih={44}
                >
                  {t("vendorSite.insights")}
                </Button>
              ) : null}
              {canManage ? (
                <Button
                  component={Link}
                  to={manageVendorPath(vendor.id)}
                  variant="default"
                  mih={44}
                >
                  {t("vendorSite.manage")}
                </Button>
              ) : null}
            </Group>
          ) : null}
        </Group>
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

      <Tabs
        value={tab}
        keepMounted={false}
        onChange={(next) =>
          void navigate(next === null || next === "products" ? base : `${base}?tab=${next}`)
        }
      >
        <Tabs.List aria-label={t("vendorSite.tabs")}>
          {VENDOR_TABS.map((candidate) => (
            <Tabs.Tab key={candidate} value={candidate} mih={44}>
              {t(`vendorSite.tab.${candidate}`)}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="products" pt="lg">
          {products !== null ? (
            <ProductsTab
              slug={vendor.slug}
              filters={filters}
              categories={categories}
              counts={counts}
              products={products}
            />
          ) : null}
        </Tabs.Panel>

        <Tabs.Panel value="about" pt="lg">
          <Stack gap="lg">
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
        </Tabs.Panel>

        <Tabs.Panel value="reviews" pt="lg">
          {reviews !== null ? (
            <ReviewSection
              target="vendor"
              targetId={vendor.id}
              reviews={reviews}
              currentUserId={user?.id ?? null}
              canModerate={canManage}
              loginPath={loginPath(`${base}?tab=reviews`)}
            />
          ) : null}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
