import {
  Avatar,
  Button,
  Group,
  Menu,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { Link, useNavigation, useSubmit } from "react-router";

import { useSession } from "../../hooks/useSession/useSession";
import { useT } from "../../i18n/LocaleProvider";

export function UserMenu({ variant = "bar" }: { variant?: "bar" | "drawer" }) {
  const t = useT();
  const { user } = useSession();
  const submit = useSubmit();
  const loggingOut = useNavigation().formAction === "/logout";

  const handleLogout = () => {
    void submit(null, { method: "post", action: "/logout" });
  };

  if (user === null && variant === "drawer") {
    return (
      <SimpleGrid cols={2} spacing="xs">
        <Button component={Link} to="/login" variant="default" size="md" h={48}>
          {t("nav.login")}
        </Button>
        <Button component={Link} to="/register" size="md" h={48}>
          {t("nav.register")}
        </Button>
      </SimpleGrid>
    );
  }

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

  if (variant === "drawer") {
    return (
      <Paper withBorder p="md" radius="lg">
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <Avatar name={name} color="brand" size={44} radius="xl" />
            <Stack gap={0} miw={0}>
              <Text fw={600} truncate>
                {name}
              </Text>
              <Text size="sm" c="dimmed" truncate>
                {user.email}
              </Text>
            </Stack>
          </Group>
          <Button variant="default" size="md" h={44} onClick={handleLogout} disabled={loggingOut}>
            {t("nav.logout")}
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Menu position="bottom-end" width={240} withinPortal>
      <Menu.Target>
        <UnstyledButton
          aria-label={t("nav.account")}
          mih={44}
          px="xs"
          style={{ borderRadius: "var(--mantine-radius-xl)" }}
        >
          <Group gap="xs" wrap="nowrap">
            <Avatar name={name} color="brand" size={34} radius="xl" />
            <Text fw={500} size="sm" maw={140} truncate visibleFrom="xl">
              {name}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{name}</Menu.Label>
        {user.role === "administrator" ? (
          <Menu.Item component={Link} to="/admin/users" mih={{ base: 44, sm: 34 }}>
            {t("nav.administration")}
          </Menu.Item>
        ) : null}
        <Menu.Item mih={{ base: 44, sm: 34 }} onClick={handleLogout} disabled={loggingOut}>
          {t("nav.logout")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
