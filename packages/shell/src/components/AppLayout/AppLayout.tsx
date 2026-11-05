import { Anchor, AppShell, Burger, Container, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { NavLink } from "../NavLink/NavLink";
import { UserMenu } from "../UserMenu/UserMenu";

const SIDEBAR_WIDTH = 240;
const TOP_BAR_HEIGHT = 52;
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

  const { vendors } = useSession();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/vendors", label: t("nav.vendors") },
    { to: "/remote-test", label: t("nav.remoteTest") },
  ];

  if (vendors === null || vendors.owned === null) {
    links.push({ to: "/become-vendor", label: t("nav.becomeVendor") });
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
      <AppShell.Navbar
        p="md"
        bg="light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))"
      >
        <Group justify="space-between" wrap="nowrap" mb="sm">
          <Anchor component={Link} to="/" fw={600} fz="lg" c="inherit" underline="never">
            {t("app.title")}
          </Anchor>
          <Burger
            opened
            onClick={closeMobile}
            hiddenFrom="sm"
            size={BURGER_ICON_SIZE}
            style={burgerStyle}
            aria-label={t("nav.close")}
          />
        </Group>

        <Stack component="nav" aria-label={t("nav.label")} gap={2} flex={1}>
          {links.map((link) => (
            <NavLink key={link.to} {...link} />
          ))}
        </Stack>

        <Stack gap="xs" pt="sm">
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
          <Anchor component={Link} to="/" fw={600} fz="lg" c="inherit" underline="never">
            {t("app.title")}
          </Anchor>
        </Group>

        <Container size="md" px="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
