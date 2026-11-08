import { Anchor, Box, Burger, Container, Divider, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { ORDERS_PATH } from "../../cart/cartPaths";
import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";
import { CartLink } from "../CartLink/CartLink";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import type { NavIconName } from "../NavIcon/NavIcon";
import { NavLink } from "../NavLink/NavLink";
import { UserMenu } from "../UserMenu/UserMenu";
import classes from "./AppLayout.module.scss";

const HEADER_HEIGHT = 64;
const ADMIN_PATH = "/admin/users";
const CONTAINER_SIZE = 1200;

function Brand() {
  const t = useT();

  return (
    <Anchor component={Link} to="/" c="inherit" underline="never" className={classes.brand}>
      <span className={classes.brandMark} aria-hidden>
        V
      </span>
      <Text component="span" fw={700} fz="lg" lh={1}>
        {t("app.title")}
      </Text>
    </Anchor>
  );
}

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

  if (user !== null) {
    links.push({ to: ORDERS_PATH, label: t("nav.orders"), icon: "orders" });
  }

  if (vendors === null || vendors.owned === null) {
    links.push({ to: "/become-vendor", label: t("nav.becomeVendor"), icon: "becomeVendor" });
  }

  if (user?.role === "administrator") {
    links.push({ to: ADMIN_PATH, label: t("nav.administration"), icon: "administration" });
  }

  const barLinks = links.filter((link) => link.to !== ADMIN_PATH);

  return (
    <Box className={classes.root}>
      <Box component="header" className={classes.header} h={HEADER_HEIGHT}>
        <Container size={CONTAINER_SIZE} px="md" h="100%">
          <Group h="100%" wrap="nowrap" gap="md">
            <Brand />

            <Group
              component="nav"
              aria-label={t("nav.label")}
              gap={4}
              ml="lg"
              visibleFrom="lg"
              wrap="nowrap"
              miw={0}
              flex="0 1 auto"
            >
              {barLinks.map((link) => (
                <NavLink key={link.to} {...link} />
              ))}
            </Group>

            <Group ml="auto" gap="xs" wrap="nowrap">
              <CartLink />
              <Box visibleFrom="lg">
                <LanguageSwitcher />
              </Box>
              <Box visibleFrom="lg">
                <UserMenu />
              </Box>
              <Burger
                opened={false}
                onClick={openMobile}
                hiddenFrom="lg"
                size={18}
                aria-label={t("nav.menu")}
                className={classes.burger}
              />
            </Group>
          </Group>
        </Container>
      </Box>

      <Drawer
        opened={mobileOpened}
        onClose={closeMobile}
        hiddenFrom="lg"
        size="100%"
        position="right"
        title={<Brand />}
        closeButtonProps={{
          "aria-label": t("nav.close"),
          className: classes.drawerClose,
        }}
        classNames={{ header: classes.drawerHeader, body: classes.drawerBody }}
      >
        <Stack h="100%" justify="space-between" gap="lg">
          <Stack component="nav" aria-label={t("nav.label")} gap={4}>
            {links.map((link) => (
              <NavLink key={link.to} {...link} variant="drawer" onNavigate={closeMobile} />
            ))}
          </Stack>

          <Stack gap="md">
            <Divider />
            <Stack gap={6}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
                {t("language.label")}
              </Text>
              <LanguageSwitcher fullWidth />
            </Stack>
            <UserMenu variant="drawer" />
          </Stack>
        </Stack>
      </Drawer>

      <Box component="main" className={classes.main}>
        <Container
          size={CONTAINER_SIZE}
          w="100%"
          px="md"
          py={{ base: "lg", sm: 48 }}
          display="flex"
          style={{ flexDirection: "column", flex: 1 }}
        >
          {children}
        </Container>
      </Box>

      <Box component="footer" className={classes.footer}>
        <Container size={CONTAINER_SIZE} px="md" py="xl">
          <Group justify="space-between" gap="md">
            <Brand />
            <Text size="sm" c="dimmed">
              {t("footer.tagline")}
            </Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
