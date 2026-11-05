import { Alert, Card, Pagination, SimpleGrid, Stack, Text } from "@mantine/core";
import { Link } from "react-router";

import { useT } from "../../../i18n/LocaleProvider";
import type { VendorPage } from "../../../vendor/vendorList.server";
import { vendorPath, VENDORS_PATH } from "../../../vendor/vendorPaths";

const DESCRIPTION_LINES = 3;

const pagePath = (page: number) => (page === 1 ? VENDORS_PATH : `${VENDORS_PATH}?page=${page}`);

export function VendorList({ vendors }: { vendors: VendorPage | null }) {
  const t = useT();

  return (
    <Stack component="section" gap="md">
      {vendors === null && (
        <Alert color="red" role="alert">
          {t("vendors.error")}
        </Alert>
      )}

      {vendors !== null && vendors.items.length === 0 && (
        <Text c="dimmed">{t("vendors.empty")}</Text>
      )}

      {vendors !== null && vendors.items.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {vendors.items.map((vendor) => (
              <Card
                key={vendor.slug}
                component={Link}
                to={vendorPath(vendor.slug)}
                withBorder
                padding="md"
              >
                <Stack gap="xs">
                  <Text fw={600}>{vendor.name}</Text>
                  <Text c="dimmed" size="sm" lineClamp={DESCRIPTION_LINES}>
                    {vendor.description}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>

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
        </>
      )}
    </Stack>
  );
}
