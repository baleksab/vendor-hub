import { Alert, Grid, Group, Paper, Stack, Text, Title } from "@mantine/core";
import {
  BackLink,
  OrderItemsTable,
  OrderStatusBadge,
  OrderTimeline,
  PaymentAttemptList,
  ShippingDetails,
  orderNumber,
} from "@vendor-hub/ui";
import type { ReactNode } from "react";
import { data, Link, useSearchParams } from "react-router";

import { ApiError } from "@vendor-hub/api-client";
import { getOrder } from "../../api/endpoints/orders.server";
import { requireUser } from "../../auth/session.server";
import { ORDERS_PATH, orderPath } from "../../cart/cartPaths";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { paymentEntries, statusLabel, timelineEntries } from "../../orders/orderLabels";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/OrderPage";
import { OrderActions } from "./components/OrderActions";
import { orderAction } from "./orderAction.server";

const NOT_FOUND = 404;

export function meta({ matches, params }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.order.title",
    descriptionKey: "seo.order.description",
    path: orderPath(params.id),
    noindex: true,
  });
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireUser(request);

  try {
    return { order: await getOrder(session.token, params.id) };
  } catch (error) {
    if (error instanceof ApiError && (error.status === NOT_FOUND || error.kind === "validation")) {
      throw data(null, { status: NOT_FOUND });
    }

    throw error;
  }
}

export function action({ request, params }: Route.ActionArgs) {
  return orderAction(request, params.id);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={2} fz="lg">
          {title}
        </Title>
        {children}
      </Stack>
    </Paper>
  );
}

export default function OrderPage({ loaderData }: Route.ComponentProps) {
  const t = useT();
  const locale = useLocale();
  const [searchParams] = useSearchParams();
  const { order } = loaderData;
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const countryName = new Intl.DisplayNames([locale], { type: "region" }).of(
    order.shipping.country,
  );

  return (
    <Stack gap="lg">
      <BackLink to={ORDERS_PATH} label={t("order.back")} linkComponent={Link} />

      {searchParams.has("placed") && order.status === "created" ? (
        <Alert color="green">{t("order.placed")}</Alert>
      ) : null}
      {searchParams.has("paid") && order.status === "paid" ? (
        <Alert color="green">{t("order.paid")}</Alert>
      ) : null}

      <Stack gap={6}>
        <Group gap="sm" align="center">
          <Title order={1}>{t("orders.number", { number: orderNumber(order.id) })}</Title>
          <OrderStatusBadge status={order.status} label={statusLabel(t, order.status)} />
        </Group>
        <Text c="dimmed">
          {t("order.vendor", { vendor: order.vendorName })} ·{" "}
          {t("orders.placed", { date: dates.format(new Date(order.createdAt)) })}
        </Text>
        {order.paymentDeadline !== null && order.allowedActions.includes("pay") ? (
          <Text size="sm">
            {t("order.payBy", { date: dates.format(new Date(order.paymentDeadline)) })}
          </Text>
        ) : null}
        {order.returnDeadline !== null && order.allowedActions.includes("requestReturn") ? (
          <Text size="sm">
            {t("order.returnBy", { date: dates.format(new Date(order.returnDeadline)) })}
          </Text>
        ) : null}
      </Stack>

      <OrderActions order={order} />

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            <Section title={t("order.items")}>
              <OrderItemsTable
                items={order.items}
                currency={order.currency}
                totalMinor={order.totalMinor}
                locale={locale}
                labels={{
                  product: t("order.col.product"),
                  quantity: t("order.col.quantity"),
                  unitPrice: t("order.col.unitPrice"),
                  lineTotal: t("order.col.lineTotal"),
                  total: t("order.total"),
                }}
              />
            </Section>
            <Section title={t("order.timeline")}>
              <OrderTimeline entries={timelineEntries(t, order)} locale={locale} />
            </Section>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Section title={t("order.shipping")}>
              <ShippingDetails
                details={order.shipping}
                countryName={countryName ?? order.shipping.country}
              />
            </Section>
            <Section title={t("order.payments")}>
              <PaymentAttemptList
                attempts={paymentEntries(t, order)}
                locale={locale}
                emptyLabel={t("order.payments.empty")}
              />
            </Section>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
