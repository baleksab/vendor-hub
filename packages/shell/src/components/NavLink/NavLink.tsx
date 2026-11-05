import { NavLink as MantineNavLink } from "@mantine/core";
import { Link, useMatch } from "react-router";

import { NavIcon, type NavIconName } from "../NavIcon/NavIcon";

type Props = { to: string; label: string; icon: NavIconName; onNavigate?: () => void };

export function NavLink({ to, label, icon, onNavigate }: Props) {
  const active = useMatch({ path: to, end: to === "/" }) !== null;

  return (
    <MantineNavLink
      component={Link}
      to={to}
      label={label}
      leftSection={<NavIcon name={icon} />}
      active={active}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      mih={{ base: 44, sm: 34 }}
      py={0}
      w="auto"
    />
  );
}
