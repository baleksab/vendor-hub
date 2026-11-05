import { Button, Group, Menu, Stack, Text } from "@mantine/core";
import { Link, useNavigation, useSubmit } from "react-router";

import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";

type Props = { touch?: boolean; onNavigate?: () => void };

export function UserMenu({ touch = false, onNavigate }: Props) {
  const t = useT();
  const { user } = useSession();
  const submit = useSubmit();
  const loggingOut = useNavigation().formAction === "/logout";
  const size = touch ? "md" : "compact-md";
  const height = touch ? 44 : undefined;

  const handleLogout = () => {
    void submit(null, { method: "post", action: "/logout" });
  };

  if (user === null) {
    const Layout = touch ? Stack : Group;

    return (
      <Layout gap="xs">
        <Button
          component={Link}
          to="/login"
          variant="default"
          size={size}
          h={height}
          onClick={onNavigate}
        >
          {t("nav.login")}
        </Button>
        <Button component={Link} to="/register" size={size} h={height} onClick={onNavigate}>
          {t("nav.register")}
        </Button>
      </Layout>
    );
  }

  const name = `${user.firstName} ${user.lastName}`;

  if (touch) {
    return (
      <Stack gap="xs">
        <Text fw={500}>{name}</Text>
        <Button variant="default" size="md" h={44} onClick={handleLogout} loading={loggingOut}>
          {t("nav.logout")}
        </Button>
      </Stack>
    );
  }

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button variant="subtle" size="md" h={44} aria-label={t("nav.account")}>
          {name}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item mih={44} onClick={handleLogout} disabled={loggingOut}>
          {t("nav.logout")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
