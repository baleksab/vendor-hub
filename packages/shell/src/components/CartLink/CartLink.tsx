import { Badge, Button } from "@mantine/core";
import { Link } from "react-router";

import { CART_PATH } from "../../cart/cartPaths";
import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";
import { NavIcon } from "../NavIcon/NavIcon";

export function CartLink() {
  const t = useT();
  const { cartCount } = useSession();

  return (
    <Button
      component={Link}
      to={CART_PATH}
      variant="subtle"
      color="gray"
      mih={44}
      px="sm"
      leftSection={<NavIcon name="cart" />}
      rightSection={
        cartCount > 0 ? (
          <Badge size="sm" circle={cartCount < 10}>
            {cartCount}
          </Badge>
        ) : null
      }
      aria-label={cartCount > 0 ? t("nav.cartWithCount", { items: cartCount }) : t("nav.cart")}
    >
      {t("nav.cart")}
    </Button>
  );
}
