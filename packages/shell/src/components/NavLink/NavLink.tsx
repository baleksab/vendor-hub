import { Button } from "@mantine/core";
import { Link, useMatch } from "react-router";

import { NavIcon, type NavIconName } from "../NavIcon/NavIcon";

type Props = {
  to: string;
  label: string;
  icon: NavIconName;
  variant?: "bar" | "drawer";
  onNavigate?: () => void;
};

export function NavLink({ to, label, icon, variant = "bar", onNavigate }: Props) {
  const active = useMatch({ path: to, end: to === "/" }) !== null;
  const drawer = variant === "drawer";

  return (
    <Button
      component={Link}
      to={to}
      variant={active ? "light" : "subtle"}
      color={active ? "brand" : "gray"}
      c={active ? undefined : "var(--mantine-color-text)"}
      justify={drawer ? "flex-start" : "center"}
      fullWidth={drawer}
      leftSection={drawer ? <NavIcon name={icon} /> : null}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      h={drawer ? 48 : 36}
      px="sm"
      fw={active ? 600 : 500}
    >
      {label}
    </Button>
  );
}
