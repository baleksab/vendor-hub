import { Card, Group, Paper, Stack, Table, Text, UnstyledButton } from "@mantine/core";
import type { InsightsVendorRow } from "@vendor-hub/types";
import { StarRating, formatPrice } from "@vendor-hub/ui";
import { Link } from "react-router";

import { RoleBadge } from "../../components/RoleBadge";
import { Trend } from "../../components/Trend";
import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { insightsVendorPath } from "../../paths";
import type { Currency } from "../../period";
import { nextSort, type Filters, type SortField } from "./filters";

const TABLE_MIN_WIDTH = 820;
const PLACEHOLDER_OPACITY = 0.55;

type Props = {
  vendors: InsightsVendorRow[];
  currency: Currency;
  filters: Filters;
  stale: boolean;
  onSort: (patch: Pick<Filters, "sort" | "order">) => void;
};

export function VendorTable({ vendors, currency, filters, stale, onSort }: Props) {
  const t = useT();
  const locale = useLocale();
  const money = (minor: number) => formatPrice(minor, currency, locale);

  const sortHeader = (field: SortField, label: string) => {
    const active = filters.sort === field;

    return (
      <Table.Th
        aria-sort={active ? (filters.order === "asc" ? "ascending" : "descending") : "none"}
      >
        <UnstyledButton
          mih={24}
          onClick={() => onSort(nextSort(filters, field))}
          aria-label={t("vendors.sort", { column: label })}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <Text size="sm" fw={600} component="span">
            {label}
          </Text>
          <span aria-hidden="true">{active ? (filters.order === "asc" ? "↑" : "↓") : "↕"}</span>
        </UnstyledButton>
      </Table.Th>
    );
  };

  const nameLink = (vendor: InsightsVendorRow) => (
    <UnstyledButton
      component={Link}
      to={insightsVendorPath(vendor.id)}
      mih={44}
      display="block"
      aria-label={t("vendors.open", { name: vendor.name })}
    >
      <Text fw={500} size="sm">
        {vendor.name}
      </Text>
      <Text size="xs" c="dimmed">
        {vendor.slug}
      </Text>
    </UnstyledButton>
  );

  const earned = (vendor: InsightsVendorRow) => (
    <>
      <Text size="sm" fw={600}>
        {money(vendor.netMinor)}
      </Text>
      <Trend current={vendor.netMinor} previous={vendor.previousNetMinor} />
    </>
  );

  return (
    <div style={{ opacity: stale ? PLACEHOLDER_OPACITY : 1 }}>
      <Paper withBorder radius="md" visibleFrom="sm" style={{ overflow: "hidden" }}>
        <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                {sortHeader("name", t("vendors.col.name"))}
                <Table.Th>{t("vendors.col.role")}</Table.Th>
                {sortHeader("revenue", t("vendors.col.earned"))}
                {sortHeader("orders", t("vendors.col.orders"))}
                {sortHeader("products", t("vendors.col.products"))}
                {sortHeader("rating", t("vendors.col.rating"))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vendors.map((vendor) => (
                <Table.Tr key={vendor.id}>
                  <Table.Td>{nameLink(vendor)}</Table.Td>
                  <Table.Td>
                    <RoleBadge role={vendor.viewerRole} />
                  </Table.Td>
                  <Table.Td>{earned(vendor)}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{vendor.orderCount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{vendor.productCount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <StarRating
                      value={vendor.ratingAvg}
                      count={vendor.ratingCount}
                      label={t("vendors.ratingLabel", { value: vendor.ratingAvg })}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Stack gap="sm" hiddenFrom="sm">
        {vendors.map((vendor) => (
          <Card key={vendor.id} withBorder radius="md" p="md">
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap">
                {nameLink(vendor)}
                <RoleBadge role={vendor.viewerRole} />
              </Group>
              <div>{earned(vendor)}</div>
              <Text size="xs" c="dimmed">
                {t("vendors.col.orders")}: {vendor.orderCount} · {t("vendors.col.products")}:{" "}
                {vendor.productCount}
              </Text>
            </Stack>
          </Card>
        ))}
      </Stack>
    </div>
  );
}
