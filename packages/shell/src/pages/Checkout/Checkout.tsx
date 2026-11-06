import {
  Alert,
  Anchor,
  Button,
  Divider,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { BackLink, PriceTag } from "@vendor-hub/ui";
import { data, Form, Link, redirect, useNavigation } from "react-router";

import { quoteCart } from "../../api/endpoints/cart.server";
import { loadCountries } from "../../api/endpoints/countries.server";
import { loginPath } from "../../auth/safeRedirect";
import { getSession } from "../../auth/session.server";
import { CART_PATH, CHECKOUT_PATH } from "../../cart/cartPaths";
import {
  checkoutKey,
  commitCart,
  getCartSession,
  readCheckout,
  readLines,
} from "../../cart/cartSession.server";
import { ContactFields } from "../../components/ContactFields/ContactFields";
import { FormAlert } from "../../components/FormAlert/FormAlert";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/Checkout";
import { checkoutAction } from "./checkoutAction.server";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.checkout.title",
    descriptionKey: "seo.checkout.description",
    path: CHECKOUT_PATH,
    noindex: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const cart = await getCartSession(request);
  const lines = readLines(cart);

  if (lines.length === 0) {
    throw redirect(CART_PATH);
  }

  const [quote, countries, { session }] = await Promise.all([
    quoteCart(lines).catch(() => null),
    loadCountries().catch(() => null),
    getSession(request),
  ]);

  if (quote !== null && !quote.canCheckout) {
    throw redirect(`${CART_PATH}?changed=1`);
  }

  const user = session?.user ?? null;
  const profile =
    user === null
      ? null
      : {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          country: user.country,
        };
  const idempotencyKey = checkoutKey(cart);

  return data(
    {
      quote,
      countries,
      defaults: readCheckout(cart) ?? profile,
      idempotencyKey,
      loggedIn: user !== null,
    },
    { headers: { "Set-Cookie": await commitCart(cart) } },
  );
}

export function action({ request }: Route.ActionArgs) {
  return checkoutAction(request);
}

export default function Checkout({ loaderData, actionData }: Route.ComponentProps) {
  const t = useT();
  const locale = useLocale();
  const navigation = useNavigation();
  const { quote, countries, defaults, idempotencyKey, loggedIn } = loaderData;
  const values = actionData?.values ?? defaults ?? undefined;
  const orderCount = new Set(
    quote?.lines.map((line) => `${line.product?.vendorId}:${line.product?.currency}`),
  ).size;

  if (quote === null || countries === null) {
    return (
      <Stack gap="md">
        <BackLink to={CART_PATH} label={t("checkout.backToCart")} linkComponent={Link} />
        <Title order={1}>{t("checkout.title")}</Title>
        <Alert color="red" role="alert">
          {quote === null ? t("cart.error.quote") : t("auth.countryError")}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <BackLink to={CART_PATH} label={t("checkout.backToCart")} linkComponent={Link} />
      <Title order={1}>{t("checkout.title")}</Title>

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Form method="post" noValidate>
            <Stack gap="md">
              <Title order={2} fz="lg">
                {t("checkout.shipping")}
              </Title>

              {loggedIn ? null : (
                <Alert color="blue">
                  <Stack gap="xs">
                    <Text size="sm">{t("checkout.guestNote")}</Text>
                    <Anchor component={Link} to={loginPath(CHECKOUT_PATH)} size="sm" fw={600}>
                      {t("checkout.loginInstead")}
                    </Anchor>
                  </Stack>
                </Alert>
              )}

              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
              <ContactFields countries={countries} values={values} errors={actionData?.fields} />

              <FormAlert message={actionData?.form} />

              <Button type="submit" size="md" mih={44} loading={navigation.state === "submitting"}>
                {loggedIn ? t("checkout.place") : t("checkout.continue")}
              </Button>
            </Stack>
          </Form>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder radius="md" p="lg">
            <Stack gap="sm">
              <Title order={2} fz="lg">
                {t("checkout.summary")}
              </Title>
              <Divider />
              {quote.lines.map((line) =>
                line.product === null ? null : (
                  <Group key={line.productId} justify="space-between" wrap="nowrap" gap="sm">
                    <Text size="sm" lineClamp={2}>
                      {line.product.name} × {line.quantity}
                    </Text>
                    <PriceTag
                      priceMinor={line.lineTotalMinor}
                      currency={line.product.currency}
                      locale={locale}
                      size="sm"
                      fw={500}
                    />
                  </Group>
                ),
              )}
              <Divider />
              {quote.totals.map((total) => (
                <Group key={total.currency} justify="space-between">
                  <Text fw={600}>{t("cart.total")}</Text>
                  <PriceTag
                    priceMinor={total.totalMinor}
                    currency={total.currency}
                    locale={locale}
                    size="lg"
                  />
                </Group>
              ))}
              {orderCount > 1 ? (
                <Text size="sm" c="dimmed">
                  {t("checkout.split", { orders: orderCount })}
                </Text>
              ) : null}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
