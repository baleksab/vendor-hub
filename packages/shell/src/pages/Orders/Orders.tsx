import {
  Alert,
  Anchor,
  Button,
  Group,
  NativeSelect,
  Pagination,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { EmptyState, OrderStatusBadge, PriceTag, orderNumber } from "@vendor-hub/ui";
import { Form, Link, useSearchParams } from "react-router";

import { listOrders } from "../../api/endpoints/orders.server";
import { requireUser } from "../../auth/session.server";
import { ORDERS_PATH, orderPath } from "../../cart/cartPaths";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { ORDER_STATUSES, statusLabel } from "../../orders/orderLabels";
import { ORDER_PAGE_SIZE, orderFiltersQuery, parseOrderFilters } from "../../orders/orderFilters";
import { pageMeta } from "../../seo/pageMeta";
import { VENDORS_PATH } from "../../vendor/vendorPaths";
import type { Route } from "./+types/Orders";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.orders.title",
    descriptionKey: "seo.orders.description",
    path: ORDERS_PATH,
    noindex: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireUser(request);
  const filters = parseOrderFilters(new URL(request.url).searchParams);

  try {
    const orders = await listOrders(session.token, {
      ...(filters.status === null ? {} : { status: filters.status }),
      limit: ORDER_PAGE_SIZE,
      offset: (filters.page - 1) * ORDER_PAGE_SIZE,
    });

    return { filters, orders };
  } catch {
    return { filters, orders: null };
  }
}

export default function Orders({ loaderData }: Route.ComponentProps) {
  const t = useT();
  const locale = useLocale();
  const [searchParams] = useSearchParams();
  const { filters, orders } = loaderData;
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const pages = orders === null ? 1 : Math.max(1, Math.ceil(orders.meta.total / ORDER_PAGE_SIZE));
  const showFilters = orders === null || orders.data.length > 0 || filters.status !== null;
  const pagePath = (page: number) => `${ORDERS_PATH}${orderFiltersQuery({ ...filters, page })}`;

  return (
    <Stack gap="lg">
      <Title order={1}>{t("orders.title")}</Title>

      {searchParams.has("placed") ? <Alert color="green">{t("orders.placedMany")}</Alert> : null}

      {showFilters ? (
        <Paper component="search" withBorder radius="md" p="md">
          <Form method="get">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" verticalSpacing="sm">
              <NativeSelect
                name="status"
                label={t("orders.filter.status")}
                defaultValue={filters.status ?? ""}
                data={[
                  { value: "", label: t("orders.filter.all") },
                  ...ORDER_STATUSES.map((status) => ({
                    value: status,
                    label: statusLabel(t, status),
                  })),
                ]}
              />
            </SimpleGrid>

            <Group justify="flex-end" mt="md">
              {filters.status === null ? (
                <Button variant="default" mih={44} disabled>
                  {t("orders.filter.reset")}
                </Button>
              ) : (
                <Button component={Link} to={ORDERS_PATH} variant="default" mih={44}>
                  {t("orders.filter.reset")}
                </Button>
              )}
              <Button type="submit" mih={44}>
                {t("orders.filter.apply")}
              </Button>
            </Group>
          </Form>
        </Paper>
      ) : null}

      {orders === null ? (
        <Alert color="red" role="alert">
          {t("orders.error")}
        </Alert>
      ) : orders.data.length === 0 ? (
        <EmptyState
          title={filters.status === null ? t("orders.empty.title") : t("orders.emptyFiltered")}
          description={filters.status === null ? t("orders.empty.text") : undefined}
          action={
            filters.status === null ? (
              <Button component={Link} to={VENDORS_PATH} mih={44}>
                {t("cart.empty.action")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stack gap="sm">
          {orders.data.map((order) => (
            <Paper key={order.id} withBorder radius="md" p="md">
              <Group justify="space-between" align="flex-start" gap="sm">
                <Stack gap={4}>
                  <Anchor component={Link} to={orderPath(order.id)} fw={600}>
                    {t("orders.number", { number: orderNumber(order.id) })}
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    {t("order.vendor", { vendor: order.vendorName })} ·{" "}
                    {t("orders.placed", { date: dates.format(new Date(order.createdAt)) })}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t("cart.items", { count: order.itemCount })}
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

          {pages <= 1 ? null : (
            <Pagination
              total={pages}
              value={filters.page}
              aria-label={t("orders.pagination")}
              getItemProps={(page) => ({ component: Link, to: pagePath(page) })}
              getControlProps={(control) => {
                const target =
                  control === "first"
                    ? 1
                    : control === "last"
                      ? pages
                      : control === "previous"
                        ? Math.max(1, filters.page - 1)
                        : Math.min(pages, filters.page + 1);

                return { component: Link, to: pagePath(target) };
              }}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}
