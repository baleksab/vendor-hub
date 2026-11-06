import { Button } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { QuantityStepper } from "@vendor-hub/ui";
import { useState } from "react";
import { useFetcher } from "react-router";

import { CART_PATH } from "../../../cart/cartPaths";
import { useIsClient } from "../../../hooks/useIsClient/useIsClient";
import { useT } from "../../../i18n/LocaleProvider";

const SUBMIT_DELAY_MS = 400;

type Props = { productId: string; name: string; quantity: number; max: number };

export function QuantityForm({ productId, name, quantity, max }: Props) {
  const t = useT();
  const fetcher = useFetcher();
  const isClient = useIsClient();
  const [value, setValue] = useState(quantity);

  const submit = useDebouncedCallback((next: number) => {
    void fetcher.submit(
      { intent: "setQuantity", productId, quantity: String(next) },
      { method: "post", action: CART_PATH },
    );
  }, SUBMIT_DELAY_MS);

  return (
    <fetcher.Form method="post" action={CART_PATH} style={{ display: "flex", gap: 8 }}>
      <input type="hidden" name="intent" value="setQuantity" />
      <input type="hidden" name="productId" value={productId} />
      <QuantityStepper
        name="quantity"
        value={value}
        max={Math.max(1, max)}
        onChange={(next) => {
          setValue(next);
          submit(next);
        }}
        label={t("cart.quantity", { name })}
        decreaseLabel={t("cart.decrease")}
        increaseLabel={t("cart.increase")}
      />
      {isClient ? null : (
        <Button type="submit" variant="default" mih={44}>
          {t("cart.updateQuantity")}
        </Button>
      )}
    </fetcher.Form>
  );
}

export function RemoveForm({ productId }: { productId: string }) {
  const t = useT();
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action={CART_PATH}>
      <input type="hidden" name="intent" value="remove" />
      <input type="hidden" name="productId" value={productId} />
      <Button
        type="submit"
        variant="subtle"
        color="red"
        mih={44}
        loading={fetcher.state !== "idle"}
      >
        {t("cart.remove")}
      </Button>
    </fetcher.Form>
  );
}
