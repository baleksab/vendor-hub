import { Anchor, AppShell, Burger, Container, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { NavLink } from "../NavLink/NavLink";
import { UserMenu } from "../UserMenu/UserMenu";

const SIDEBAR_WIDTH = 280;
const TOP_BAR_HEIGHT = 56;

export function AppLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const [mobileOpened, { open: openMobile, close: closeMobile }] = useDisclosure(false);
  const [desktopOpened, desktop] = useDisclosure(true);
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

  const closeSidebar = () => {
    closeMobile();
    desktop.close();
  };

  return (
    <AppShell
      navbar={{
        width: SIDEBAR_WIDTH,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding={0}
    >
      <AppShell.Navbar
        p="md"
        bg="light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))"
      >
        <Group justify="space-between" wrap="nowrap" mb="md">
          <Anchor component={Link} to="/" fw={500} fz="xl" c="inherit" underline="never">
            {t("app.title")}
          </Anchor>
          <Burger opened onClick={closeSidebar} size={44} aria-label={t("nav.close")} />
        </Group>

        <Stack component="nav" aria-label={t("nav.label")} gap={4} flex={1}>
          {links.map((link) => (
            <NavLink key={link.to} {...link} />
          ))}
        </Stack>

        <Stack gap="sm" pt="md">
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
          <Burger opened={false} onClick={openMobile} size={44} aria-label={t("nav.menu")} />
          <Anchor component={Link} to="/" fw={500} fz="lg" c="inherit" underline="never">
            {t("app.title")}
          </Anchor>
        </Group>

        {!desktopOpened && (
          <Burger
            visibleFrom="sm"
            opened={false}
            onClick={desktop.open}
            size={44}
            pos="fixed"
            top="var(--mantine-spacing-xs)"
            left="var(--mantine-spacing-xs)"
            aria-label={t("nav.menu")}
          />
        )}

        <Container size="md" px="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
