import { NavLink as MantineNavLink } from "@mantine/core";
import { Link, useMatch } from "react-router";

type Props = { to: string; label: string; onNavigate?: () => void };

export function NavLink({ to, label, onNavigate }: Props) {
  const active = useMatch({ path: to, end: to === "/" }) !== null;

  return (
    <MantineNavLink
      component={Link}
      to={to}
      label={label}
      active={active}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      mih={44}
      w="auto"
    />
  );
}
