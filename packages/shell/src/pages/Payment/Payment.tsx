import { Alert, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import type { OrderResponse } from "@vendor-hub/types";
import { BackLink, formatPrice, orderNumber } from "@vendor-hub/ui";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import { getOrder } from "../../api/endpoints/orders.server";
import { requireUser } from "../../auth/session.server";
import { orderPath, paymentPath } from "../../cart/cartPaths";
import { FormAlert } from "../../components/FormAlert/FormAlert";
import { FormField } from "../../components/FormField/FormField";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { TEST_CARDS } from "../../orders/testCards";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/Payment";
import { paymentAction } from "./paymentAction.server";

const NOT_FOUND = 404;

export function meta({ matches, params }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.payment.title",
    descriptionKey: "seo.payment.description",
    path: paymentPath(params.id),
    noindex: true,
  });
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireUser(request);
  let order: OrderResponse;

  try {
    order = await getOrder(session.token, params.id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === NOT_FOUND || error.kind === "validation")) {
      throw data(null, { status: NOT_FOUND });
    }

    throw error;
  }

  if (!order.allowedActions.includes("pay")) {
    throw redirect(orderPath(order.id));
  }

  return { order };
}

export function action({ request, params }: Route.ActionArgs) {
  return paymentAction(request, params.id);
}

export default function Payment({ loaderData, actionData }: Route.ComponentProps) {
  const t = useT();
  const locale = useLocale();
  const navigation = useNavigation();
  const { order } = loaderData;
  const amount = formatPrice(order.totalMinor, order.currency, locale);
  const outcome = actionData !== undefined && "outcome" in actionData ? actionData : null;
  const errors = actionData !== undefined && "fields" in actionData ? actionData : null;

  return (
    <Stack gap="lg">
      <BackLink to={orderPath(order.id)} label={t("payment.backToOrder")} linkComponent={Link} />
      <Title order={1}>{t("payment.title", { number: orderNumber(order.id) })}</Title>

      <Alert color="blue" role="note">
        {t("payment.hint", TEST_CARDS)}
      </Alert>

      {outcome?.outcome === "failed" ? (
        <Alert color="red" role="alert">
          <Stack gap={4}>
            <Text size="sm">
              {t("payment.failed", {
                reason: outcome.reason === null ? "" : t(`order.failure.${outcome.reason}`),
              })}
            </Text>
            <Text size="sm">{t("payment.attemptsLeft", { left: outcome.attemptsLeft })}</Text>
          </Stack>
        </Alert>
      ) : null}

      {outcome?.outcome === "cancelled" ? (
        <Alert color="red" role="alert">
          <Stack gap="sm">
            <Text size="sm">{t("payment.cancelled")}</Text>
            <Group>
              <Button component={Link} to={orderPath(order.id)} variant="default" mih={44}>
                {t("payment.backToOrder")}
              </Button>
            </Group>
          </Stack>
        </Alert>
      ) : (
        <Paper withBorder radius="md" p="lg">
          <Form method="post" noValidate>
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, md: 2 }}>
                <FormField
                  name="cardNumber"
                  label={t("payment.card")}
                  autoComplete="off"
                  maxLength={23}
                  error={errors?.fields.cardNumber}
                />
              </SimpleGrid>
              <FormAlert message={errors?.form} />
              <Group>
                <Button
                  type="submit"
                  size="md"
                  mih={44}
                  loading={navigation.state === "submitting"}
                >
                  {t("payment.submit", { amount })}
                </Button>
                <Button component={Link} to={orderPath(order.id)} variant="subtle" mih={44}>
                  {t("order.cancel")}
                </Button>
              </Group>
            </Stack>
          </Form>
        </Paper>
      )}
    </Stack>
  );
}
