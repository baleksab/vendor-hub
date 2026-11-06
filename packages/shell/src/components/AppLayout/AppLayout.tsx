import { Anchor, AppShell, Burger, Container, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { MANAGE_VENDORS_PATH, manageVendorsLabelKey } from "../../vendor/manageVendorsLink";
import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import type { NavIconName } from "../NavIcon/NavIcon";
import { NavLink } from "../NavLink/NavLink";
import { UserMenu } from "../UserMenu/UserMenu";

const SIDEBAR_WIDTH = 240;
const TOP_BAR_HEIGHT = 56;
const BURGER_ICON_SIZE = 18;
const BURGER_TOUCH_PADDING = 13;
const burgerStyle = { boxSizing: "content-box", padding: BURGER_TOUCH_PADDING } as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const [mobileOpened, { open: openMobile, close: closeMobile }] = useDisclosure(false);
  const location = useLocation();

  useEffect(() => {
    closeMobile();
  }, [location.key, closeMobile]);

  const { user, vendors } = useSession();

  const links: { to: string; label: string; icon: NavIconName }[] = [
    { to: "/", label: t("nav.home"), icon: "home" },
    { to: "/vendors", label: t("nav.vendors"), icon: "vendors" },
  ];

  if (vendors === null || vendors.owned === null) {
    links.push({ to: "/become-vendor", label: t("nav.becomeVendor"), icon: "becomeVendor" });
  }

  if (user?.role === "administrator") {
    links.push({ to: "/admin/users", label: t("nav.administration"), icon: "administration" });
  }

  if (manageVendorsLabelKey(user, vendors) !== null) {
    links.push({
      to: MANAGE_VENDORS_PATH,
      label: t("nav.vendorAdministration"),
      icon: "vendorAdministration",
    });
  }

  return (
    <AppShell
      navbar={{
        width: SIDEBAR_WIDTH,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding={0}
    >
      <AppShell.Navbar bg="light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))">
        <Group h={TOP_BAR_HEIGHT} px="md" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Burger
            opened
            onClick={closeMobile}
            hiddenFrom="sm"
            size={BURGER_ICON_SIZE}
            style={burgerStyle}
            aria-label={t("nav.close")}
          />
          <Anchor component={Link} to="/" fw={600} fz="lg" c="inherit" underline="never" px="xs">
            {t("app.title")}
          </Anchor>
        </Group>

        <Stack component="nav" aria-label={t("nav.label")} gap={2} flex={1} px="md" pt="md">
          {links.map((link) => (
            <NavLink key={link.to} {...link} />
          ))}
        </Stack>

        <Stack gap="xs" p="md">
          <LanguageSwitcher />
          <UserMenu />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Group
          hiddenFrom="sm"
          h={TOP_BAR_HEIGHT}
          px="md"
          wrap="nowrap"
          pos="sticky"
          top={0}
          style={{ zIndex: 10, borderBottom: "1px solid var(--mantine-color-default-border)" }}
          bg="var(--mantine-color-body)"
        >
          <Burger
            opened={false}
            onClick={openMobile}
            size={BURGER_ICON_SIZE}
            style={burgerStyle}
            aria-label={t("nav.menu")}
          />
          <Anchor component={Link} to="/" fw={600} fz="lg" c="inherit" underline="never" px="xs">
            {t("app.title")}
          </Anchor>
        </Group>

        <Container
          size="md"
          px="md"
          py={{ base: "lg", sm: 56 }}
          display="flex"
          mih={{ base: `calc(100dvh - ${TOP_BAR_HEIGHT}px)`, sm: "100dvh" }}
          style={{ flexDirection: "column" }}
        >
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
