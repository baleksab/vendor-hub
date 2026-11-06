import {
  Anchor,
  Group,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  BackLink,
  EmptyState,
  ErrorAlert,
  OrderStatusBadge,
  PageHeader,
  PriceTag,
  orderNumber,
} from "@vendor-hub/ui";
import { Link, useParams, useSearchParams } from "react-router";

import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { useVendor } from "../../hooks/useVendor";
import { useVendorOrders } from "../../hooks/useVendorOrders";
import { ORDER_STATUSES, statusLabel } from "../../orderLabels";
import { orderPath, vendorPath } from "../../paths";
import { ORDER_PAGE_SIZE, readFilters, writeFilters } from "./filters";

const SKELETON_ROWS = 5;
const SKELETON_HEIGHT = 44;

export default function OrderList() {
  const t = useT();
  const locale = useLocale();
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const vendor = useVendor(id);
  const orders = useVendorOrders(id, {
    ...(filters.status === null ? {} : { status: filters.status }),
    limit: ORDER_PAGE_SIZE,
    offset: (filters.page - 1) * ORDER_PAGE_SIZE,
  });
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const items = orders.data?.data ?? [];
  const total = orders.data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE));

  return (
    <Stack gap="md">
      <BackLink to={vendorPath(id)} label={t("orders.back")} linkComponent={Link} />
      <PageHeader
        title={t("orders.title")}
        description={vendor.data ? t("orders.description", { name: vendor.data.name }) : undefined}
      />

      <Paper withBorder radius="md" p="md">
        <Select
          label={t("orders.filter.status")}
          placeholder={t("orders.filter.all")}
          data={ORDER_STATUSES.map((status) => ({ value: status, label: statusLabel(t, status) }))}
          value={filters.status}
          onChange={(value) =>
            setSearchParams(
              writeFilters({ status: (value as typeof filters.status) ?? null, page: 1 }),
            )
          }
          clearable
          maw={280}
        />
      </Paper>

      {orders.isError ? (
        <ErrorAlert
          title={t("orders.error.title")}
          message={t("orders.error.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void orders.refetch()}
        />
      ) : orders.isPending ? (
        <Stack gap="xs">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height={SKELETON_HEIGHT} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            filters.status === null ? t("orders.empty.title") : t("orders.emptyFiltered.title")
          }
          description={filters.status === null ? t("orders.empty.description") : undefined}
        />
      ) : (
        <>
          <Text size="sm" c="dimmed">
            {t("orders.total", { total })}
          </Text>

          <Table verticalSpacing="sm" highlightOnHover visibleFrom="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("orders.col.number")}</Table.Th>
                <Table.Th>{t("orders.col.buyer")}</Table.Th>
                <Table.Th>{t("orders.col.total")}</Table.Th>
                <Table.Th>{t("orders.col.status")}</Table.Th>
                <Table.Th>{t("orders.col.created")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((order) => (
                <Table.Tr key={order.id}>
                  <Table.Td>
                    <Anchor component={Link} to={orderPath(id, order.id)} fw={600}>
                      {orderNumber(order.id)}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{order.buyerName}</Table.Td>
                  <Table.Td>
                    <PriceTag
                      priceMinor={order.totalMinor}
                      currency={order.currency}
                      locale={locale}
                      fw={500}
                    />
                  </Table.Td>
                  <Table.Td>
                    <OrderStatusBadge status={order.status} label={statusLabel(t, order.status)} />
                  </Table.Td>
                  <Table.Td>{dates.format(new Date(order.createdAt))}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Stack gap="sm" hiddenFrom="sm">
            {items.map((order) => (
              <Paper key={order.id} withBorder radius="md" p="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={2} miw={0}>
                    <Anchor component={Link} to={orderPath(id, order.id)} fw={600}>
                      {orderNumber(order.id)}
                    </Anchor>
                    <Text size="sm">{order.buyerName}</Text>
                    <Text size="xs" c="dimmed">
                      {dates.format(new Date(order.createdAt))}
                    </Text>
                  </Stack>
                  <Stack gap={6} align="flex-end">
                    <OrderStatusBadge status={order.status} label={statusLabel(t, order.status)} />
                    <PriceTag
                      priceMinor={order.totalMinor}
                      currency={order.currency}
                      locale={locale}
                    />
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>

          {pages <= 1 ? null : (
            <Pagination
              total={pages}
              value={filters.page}
              onChange={(page) => setSearchParams(writeFilters({ ...filters, page }))}
              aria-label={t("orders.pagination")}
            />
          )}
        </>
      )}
    </Stack>
  );
}
