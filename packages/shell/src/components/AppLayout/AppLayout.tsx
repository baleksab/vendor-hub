import { Anchor, AppShell, Burger, Container, Drawer, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { useT } from "../../i18n/LocaleProvider";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { NavLink } from "../NavLink/NavLink";
import { UserMenu } from "../UserMenu/UserMenu";

export function AppLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const [opened, { toggle, close }] = useDisclosure(false);
  const location = useLocation();

  useEffect(close, [location.key, close]);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/remote-test", label: t("nav.remoteTest") },
  ];

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="md" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size={44}
                aria-label={t("nav.menu")}
              />
              <Anchor component={Link} to="/" fw={700} c="inherit" underline="never">
                {t("app.title")}
              </Anchor>
            </Group>

            <Group component="nav" aria-label={t("nav.label")} gap="xs" visibleFrom="sm">
              {links.map((link) => (
                <NavLink key={link.to} {...link} />
              ))}
            </Group>

            <Group visibleFrom="sm">
              <LanguageSwitcher />
              <UserMenu />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <Drawer
        opened={opened}
        onClose={close}
        title={t("app.title")}
        hiddenFrom="sm"
        size="xs"
        closeButtonProps={{ w: 44, h: 44 }}
      >
        <Stack component="nav" aria-label={t("nav.label")} gap="xs">
          {links.map((link) => (
            <NavLink key={link.to} {...link} onNavigate={close} />
          ))}
          <LanguageSwitcher touch />
          <UserMenu touch onNavigate={close} />
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Container size="md">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
