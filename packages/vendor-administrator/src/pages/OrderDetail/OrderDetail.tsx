import {
  Button,
  Grid,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ApiError } from "@vendor-hub/api-client";
import {
  BackLink,
  EmptyState,
  ErrorAlert,
  OrderItemsTable,
  OrderStatusBadge,
  OrderTimeline,
  PaymentAttemptList,
  ShippingDetails,
  formatPrice,
  orderNumber,
} from "@vendor-hub/ui";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";

import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { useApproveReturn } from "../../hooks/useApproveReturn";
import { useDeliverOrder } from "../../hooks/useDeliverOrder";
import { useOrder } from "../../hooks/useOrder";
import { useRejectReturn } from "../../hooks/useRejectReturn";
import { paymentEntries, statusLabel, timelineEntries } from "../../orderLabels";
import { ordersPath } from "../../paths";

const NOT_FOUND = 404;
const SKELETON_HEIGHT = 320;
const REASON_MAX = 1000;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={2} size="h4">
          {title}
        </Title>
        {children}
      </Stack>
    </Paper>
  );
}

export default function OrderDetail() {
  const t = useT();
  const locale = useLocale();
  const { id = "", orderId = "" } = useParams();
  const { data: order, error, isPending, refetch } = useOrder(orderId);
  const deliver = useDeliverOrder(orderId);
  const approve = useApproveReturn(orderId);
  const reject = useRejectReturn(orderId);
  const [approveOpened, approveModal] = useDisclosure(false);
  const [rejectOpened, rejectModal] = useDisclosure(false);
  const [reason, setReason] = useState("");

  const back = <BackLink to={ordersPath(id)} label={t("order.back")} linkComponent={Link} />;

  if (isPending) {
    return <Skeleton height={SKELETON_HEIGHT} />;
  }

  if (error) {
    if (error instanceof ApiError && error.status === NOT_FOUND) {
      return (
        <EmptyState
          title={t("order.notFound.title")}
          description={t("order.notFound.message")}
          action={back}
        />
      );
    }

    return (
      <Stack>
        {back}
        <ErrorAlert
          title={t("order.loadError.title")}
          message={t("orders.error.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetch()}
        />
      </Stack>
    );
  }

  const allowed = new Set(order.allowedActions);
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const countryName =
    new Intl.DisplayNames([locale], { type: "region" }).of(order.shipping.country) ??
    order.shipping.country;
  const failed = deliver.isError || approve.isError || reject.isError;

  const confirmApprove = () => approve.mutate(undefined, { onSuccess: approveModal.close });
  const confirmReject = () =>
    reject.mutate(reason.trim(), {
      onSuccess: () => {
        rejectModal.close();
        setReason("");
      },
    });

  return (
    <Stack gap="md">
      {back}

      <Stack gap={4}>
        <Group gap="sm">
          <Title order={1}>{t("order.number", { number: orderNumber(order.id) })}</Title>
          <OrderStatusBadge status={order.status} label={statusLabel(t, order.status)} />
        </Group>
        <Text c="dimmed">
          {order.buyerName} · {t("order.placed", { date: dates.format(new Date(order.createdAt)) })}
        </Text>
      </Stack>

      {failed ? (
        <Text c="red" size="sm" role="alert">
          {t("order.actionFailed")}
        </Text>
      ) : null}

      {allowed.size === 0 ? null : (
        <Group gap="sm">
          {allowed.has("deliver") ? (
            <Button mih={44} loading={deliver.isPending} onClick={() => deliver.mutate()}>
              {t("order.deliver")}
            </Button>
          ) : null}
          {allowed.has("approveReturn") ? (
            <Button mih={44} onClick={approveModal.open}>
              {t("order.approveReturn")}
            </Button>
          ) : null}
          {allowed.has("rejectReturn") ? (
            <Button mih={44} variant="default" onClick={rejectModal.open}>
              {t("order.rejectReturn")}
            </Button>
          ) : null}
        </Group>
      )}

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
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
                  total: t("order.totalLabel"),
                }}
              />
            </Section>
            <Section title={t("order.timeline")}>
              <OrderTimeline entries={timelineEntries(t, order)} locale={locale} />
            </Section>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Section title={t("order.shipping")}>
              <ShippingDetails details={order.shipping} countryName={countryName} />
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

      <Modal opened={approveOpened} onClose={approveModal.close} title={t("order.approveTitle")}>
        <Stack>
          <Text size="sm">
            {t("order.approveText", {
              amount: formatPrice(order.totalMinor, order.currency, locale),
            })}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" mih={44} onClick={approveModal.close}>
              {t("common.cancel")}
            </Button>
            <Button mih={44} loading={approve.isPending} onClick={confirmApprove}>
              {t("order.approveReturn")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={rejectOpened} onClose={rejectModal.close} title={t("order.rejectReturn")}>
        <Stack>
          <Textarea
            label={t("order.rejectReason")}
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            maxLength={REASON_MAX}
            autosize
            minRows={3}
            withAsterisk
          />
          <Group justify="flex-end">
            <Button variant="default" mih={44} onClick={rejectModal.close}>
              {t("common.cancel")}
            </Button>
            <Button
              color="red"
              mih={44}
              disabled={reason.trim() === ""}
              loading={reject.isPending}
              onClick={confirmReject}
            >
              {t("order.rejectReturn")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
