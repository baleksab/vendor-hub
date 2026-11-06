import { Card, Group, Paper, Stack, Table, Text, UnstyledButton } from "@mantine/core";
import type { ManagedVendorListItemResponse } from "@vendor-hub/types";

import { RoleBadge } from "../../components/RoleBadge";
import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { nextSort, type Filters, type SortField } from "./filters";

const TABLE_MIN_WIDTH = 720;
const PLACEHOLDER_OPACITY = 0.55;

type Props = {
  vendors: ManagedVendorListItemResponse[];
  filters: Filters;
  stale: boolean;
  onSort: (patch: Pick<Filters, "sort" | "order">) => void;
  onOpen: (vendor: ManagedVendorListItemResponse) => void;
};

export function VendorTable({ vendors, filters, stale, onSort, onOpen }: Props) {
  const t = useT();
  const locale = useLocale();
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const ownerName = (vendor: ManagedVendorListItemResponse) =>
    `${vendor.owner.firstName} ${vendor.owner.lastName}`;

  const sortHeader = (field: SortField, label: string) => {
    const active = filters.sort === field;
    const sortLabel = t("vendors.sort", { column: label });

    return (
      <Table.Th
        aria-sort={active ? (filters.order === "asc" ? "ascending" : "descending") : "none"}
      >
        <UnstyledButton
          mih={24}
          onClick={() => onSort(nextSort(filters, field))}
          aria-label={sortLabel}
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

  const nameButton = (vendor: ManagedVendorListItemResponse) => (
    <UnstyledButton
      mih={44}
      ta="left"
      display="block"
      onClick={() => onOpen(vendor)}
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

  return (
    <div style={{ opacity: stale ? PLACEHOLDER_OPACITY : 1 }}>
      <Paper withBorder radius="md" visibleFrom="sm" style={{ overflow: "hidden" }}>
        <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                {sortHeader("name", t("vendors.col.name"))}
                <Table.Th>{t("vendors.col.owner")}</Table.Th>
                {sortHeader("memberCount", t("vendors.col.users"))}
                <Table.Th>{t("vendors.col.role")}</Table.Th>
                {sortHeader("createdAt", t("vendors.col.created"))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vendors.map((vendor) => (
                <Table.Tr key={vendor.id}>
                  <Table.Td>{nameButton(vendor)}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{ownerName(vendor)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{vendor.memberCount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <RoleBadge role={vendor.memberRole} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{dateFormat.format(new Date(vendor.createdAt))}</Text>
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
              {nameButton(vendor)}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {ownerName(vendor)}
                </Text>
                <RoleBadge role={vendor.memberRole} />
              </Group>
              <Text size="xs" c="dimmed">
                {t("vendors.col.users")}: {vendor.memberCount} ·{" "}
                {dateFormat.format(new Date(vendor.createdAt))}
              </Text>
            </Stack>
          </Card>
        ))}
      </Stack>
    </div>
  );
}
