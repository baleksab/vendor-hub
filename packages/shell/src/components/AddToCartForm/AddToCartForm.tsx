import { Anchor, Group, Stack, Text } from "@mantine/core";
import { AddToCartButton, QuantityStepper } from "@vendor-hub/ui";
import { useState } from "react";
import { Link, useFetcher } from "react-router";

import type { CartActionResult } from "../../cart/cartAction.server";
import { CART_PATH } from "../../cart/cartPaths";
import { FormAlert } from "../FormAlert/FormAlert";
import { useT } from "../../i18n/LocaleProvider";

type Props = {
  productId: string;
  name: string;
  stock: number;
  withQuantity?: boolean;
};

export function AddToCartForm({ productId, name, stock, withQuantity = false }: Props) {
  const t = useT();
  const fetcher = useFetcher<CartActionResult>();
  const [quantity, setQuantity] = useState(1);
  const result = fetcher.state === "idle" ? fetcher.data : undefined;

  return (
    <Stack gap="xs">
      <fetcher.Form method="post" action={CART_PATH}>
        <input type="hidden" name="intent" value="add" />
        <input type="hidden" name="productId" value={productId} />
        <Group gap="sm" wrap="nowrap">
          {withQuantity && stock > 0 ? (
            <QuantityStepper
              name="quantity"
              value={quantity}
              max={stock}
              onChange={setQuantity}
              label={t("cart.quantity", { name })}
              decreaseLabel={t("cart.decrease")}
              increaseLabel={t("cart.increase")}
            />
          ) : (
            <input type="hidden" name="quantity" value="1" />
          )}
          <AddToCartButton
            stock={stock}
            label={t("cart.add")}
            outOfStockLabel={t("stock.out")}
            loading={fetcher.state !== "idle"}
            fullWidth={!withQuantity}
          />
        </Group>
      </fetcher.Form>

      {result?.ok === true ? (
        <Text size="sm" c="green">
          {t("cart.added")}{" "}
          <Anchor component={Link} to={CART_PATH} size="sm">
            {t("cart.viewCart")}
          </Anchor>
        </Text>
      ) : null}
      {result?.ok === false ? <FormAlert message={result.error} /> : null}
    </Stack>
  );
}
