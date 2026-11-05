import { Avatar, Button, Group, Menu, Stack, Text, UnstyledButton } from "@mantine/core";
import { Link, useNavigation, useSubmit } from "react-router";

import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";

export function UserMenu() {
  const t = useT();
  const { user } = useSession();
  const submit = useSubmit();
  const loggingOut = useNavigation().formAction === "/logout";

  const handleLogout = () => {
    void submit(null, { method: "post", action: "/logout" });
  };

  if (user === null) {
    return (
      <Stack gap="xs">
        <Button component={Link} to="/login" variant="default" size="md" h={44}>
          {t("nav.login")}
        </Button>
        <Button component={Link} to="/register" size="md" h={44}>
          {t("nav.register")}
        </Button>
      </Stack>
    );
  }

  const name = `${user.firstName} ${user.lastName}`;

  return (
    <Menu position="top-start" width="target" withinPortal>
      <Menu.Target>
        <UnstyledButton
          aria-label={t("nav.account")}
          mih={44}
          p="xs"
          style={{ borderRadius: "var(--mantine-radius-md)" }}
        >
          <Group gap="sm" wrap="nowrap">
            <Avatar name={name} color="clay" radius="xl" />
            <Text fw={500} truncate>
              {name}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item mih={44} onClick={handleLogout} disabled={loggingOut}>
          {t("nav.logout")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
