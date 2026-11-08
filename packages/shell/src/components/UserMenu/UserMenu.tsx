import { Avatar, Button, Group, Menu, Text, UnstyledButton } from "@mantine/core";
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
      <Group gap="xs" wrap="nowrap">
        <Button component={Link} to="/login" variant="subtle" color="gray" h={{ base: 44, md: 36 }}>
          {t("nav.login")}
        </Button>
        <Button component={Link} to="/register" h={{ base: 44, md: 36 }}>
          {t("nav.register")}
        </Button>
      </Group>
    );
  }

  const name = `${user.firstName} ${user.lastName}`;

  return (
    <Menu position="bottom-end" width={200} withinPortal>
      <Menu.Target>
        <UnstyledButton
          aria-label={t("nav.account")}
          mih={44}
          px="xs"
          style={{ borderRadius: "var(--mantine-radius-xl)" }}
        >
          <Group gap="xs" wrap="nowrap">
            <Avatar name={name} color="brand" size={34} radius="xl" />
            <Text fw={500} size="sm" maw={140} truncate visibleFrom="lg">
              {name}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{name}</Menu.Label>
        <Menu.Item mih={{ base: 44, sm: 34 }} onClick={handleLogout} disabled={loggingOut}>
          {t("nav.logout")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
