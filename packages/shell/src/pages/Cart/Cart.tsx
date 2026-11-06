import { Alert, Button, Divider, Grid, Paper, Stack, Text, Title } from "@mantine/core";
import { CartLine, CartSummary, EmptyState } from "@vendor-hub/ui";
import type { CartQuoteLineResponse, CartQuoteResponse } from "@vendor-hub/types";
import { Form, Link, useNavigation, useSearchParams } from "react-router";

import { quoteCart } from "../../api/endpoints/cart.server";
import { cartAction } from "../../cart/cartAction.server";
import { CHECKOUT_PATH } from "../../cart/cartPaths";
import { getCartSession, readLines } from "../../cart/cartSession.server";
import { FormAlert } from "../../components/FormAlert/FormAlert";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import type { T } from "../../i18n";
import { pageMeta } from "../../seo/pageMeta";
import { productImagePath, productPath, VENDORS_PATH } from "../../vendor/vendorPaths";
import type { Route } from "./+types/Cart";
import { QuantityForm, RemoveForm } from "./components/CartLineForms";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.cart.title",
    descriptionKey: "seo.cart.description",
    path: "/cart",
    noindex: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const lines = readLines(await getCartSession(request));

  if (lines.length === 0) {
    return { quote: null, failed: false };
  }

  try {
    return { quote: await quoteCart(lines), failed: false };
  } catch {
    return { quote: null, failed: true };
  }
}

export function action({ request }: Route.ActionArgs) {
  return cartAction(request);
}

type VendorGroup = { key: string; title: string | null; lines: CartQuoteLineResponse[] };

function groupByVendor(quote: CartQuoteResponse): VendorGroup[] {
  const groups = new Map<string, VendorGroup>();

  for (const line of quote.lines) {
    const key = line.product?.vendorId ?? "unavailable";
    const group = groups.get(key) ?? {
      key,
      title: line.product?.vendorName ?? null,
      lines: [],
    };

    group.lines.push(line);
    groups.set(key, group);
  }

  return [...groups.values()];
}

function warningFor(line: CartQuoteLineResponse, t: T): string | null {
  switch (line.status) {
    case "ok":
      return null;
    case "quantityReduced":
      return t("cart.warning.quantityReduced", { available: line.quantity });
    case "outOfStock":
      return t("cart.warning.outOfStock");
    case "unavailable":
      return t("cart.warning.unavailable");
  }
}

export default function Cart({ loaderData, actionData }: Route.ComponentProps) {
  const t = useT();
  const locale = useLocale();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const { quote, failed } = loaderData;
  const changed = searchParams.has("changed");

  if (failed) {
    return (
      <Stack gap="md">
        <Title order={1}>{t("cart.title")}</Title>
        <Alert color="red" role="alert">
          {t("cart.error.quote")}
        </Alert>
      </Stack>
    );
  }

  if (quote === null) {
    return (
      <Stack gap="md">
        <Title order={1}>{t("cart.title")}</Title>
        <EmptyState
          title={t("cart.empty.title")}
          description={t("cart.empty.text")}
          action={
            <Button component={Link} to={VENDORS_PATH} mih={44}>
              {t("cart.empty.action")}
            </Button>
          }
        />
      </Stack>
    );
  }

  const groups = groupByVendor(quote);
  const itemCount = quote.lines.reduce((sum, line) => sum + line.quantity, 0);
  const formError = actionData !== undefined && !actionData.ok ? actionData.error : null;

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1}>{t("cart.title")}</Title>
        <Text c="dimmed">{t("cart.items", { count: itemCount })}</Text>
      </Stack>

      {changed ? <Alert color="yellow">{t("cart.changed")}</Alert> : null}

      <FormAlert message={formError} />

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            {groups.map((group) => (
              <Paper key={group.key} withBorder radius="md" px="md">
                <Text fw={600} pt="md">
                  {group.title === null
                    ? t("cart.warning.unavailable")
                    : t("cart.vendor", { vendor: group.title })}
                </Text>
                {group.lines.map((line, index) => (
                  <div key={line.productId}>
                    {index === 0 ? null : <Divider />}
                    <CartLine
                      name={line.product?.name ?? t("cart.unavailableName")}
                      href={
                        line.product === null
                          ? null
                          : productPath(line.product.vendorSlug, line.product.id)
                      }
                      linkComponent={Link}
                      imageUrl={
                        line.product?.coverImageId == null
                          ? null
                          : productImagePath(line.product.coverImageId)
                      }
                      noImageLabel={t("products.noImage")}
                      priceMinor={line.product?.priceMinor ?? null}
                      lineTotalMinor={line.lineTotalMinor}
                      currency={line.product?.currency ?? null}
                      locale={locale}
                      warning={warningFor(line, t)}
                      quantityControl={
                        line.product === null || line.product.stock <= 0 ? null : (
                          <QuantityForm
                            key={`${line.productId}:${line.requestedQuantity}`}
                            productId={line.productId}
                            name={line.product.name}
                            quantity={line.requestedQuantity}
                            max={line.product.stock}
                          />
                        )
                      }
                      removeControl={<RemoveForm productId={line.productId} />}
                    />
                  </div>
                ))}
              </Paper>
            ))}

            <Form method="post">
              <input type="hidden" name="intent" value="clear" />
              <Button type="submit" variant="subtle" color="gray" mih={44}>
                {t("cart.clear")}
              </Button>
            </Form>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <CartSummary
            title={t("cart.summary")}
            totals={quote.totals}
            totalLabel={t("cart.total")}
            locale={locale}
            note={
              groups.length > 1 || quote.totals.length > 1 ? t("cart.multiCurrency") : undefined
            }
          >
            {quote.canCheckout ? (
              <Button component={Link} to={CHECKOUT_PATH} size="md" mih={44} fullWidth>
                {t("cart.checkout")}
              </Button>
            ) : (
              <Form method="post">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t("cart.checkoutBlocked")}
                  </Text>
                  <input type="hidden" name="intent" value="reconcile" />
                  <Button
                    type="submit"
                    size="md"
                    mih={44}
                    fullWidth
                    loading={navigation.state === "submitting"}
                  >
                    {t("cart.reconcile")}
                  </Button>
                </Stack>
              </Form>
            )}
          </CartSummary>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
