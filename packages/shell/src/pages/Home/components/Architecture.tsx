import { Box, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import { useT } from "../../../i18n/LocaleProvider";

const CONNECTOR_HEIGHT = 20;

function Connector() {
  return (
    <Box
      aria-hidden
      mx="auto"
      w={1}
      h={CONNECTOR_HEIGHT}
      bg="var(--mantine-color-default-border)"
    />
  );
}

export function Architecture() {
  const t = useT();

  return (
    <SimpleGrid
      component="section"
      cols={{ base: 1, md: 2 }}
      spacing="xl"
      aria-labelledby="home-architecture"
    >
      <Stack gap="sm" justify="center">
        <Title order={2} id="home-architecture">
          {t("home.architecture.title")}
        </Title>
        <Text c="dimmed">{t("home.architecture.text")}</Text>
      </Stack>

      <Stack gap={0} aria-hidden>
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600} size="sm">
              {t("home.architecture.shell")}
            </Text>
            <Paper withBorder p="sm" radius="md" bg="var(--mantine-primary-color-light)">
              <Text size="sm" ta="center">
                {t("home.architecture.pages")}
              </Text>
            </Paper>
            <Text c="dimmed" size="xs">
              {t("home.architecture.modules")}
            </Text>
            <SimpleGrid cols={2} spacing="xs">
              {(["vendors", "users"] as const).map((module) => (
                <Paper
                  key={module}
                  p="sm"
                  radius="md"
                  style={{ border: "1px dashed var(--mantine-color-default-border)" }}
                >
                  <Text size="sm" ta="center">
                    {t(`home.architecture.${module}`)}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>

        <Connector />

        <Paper withBorder p="sm" radius="md">
          <Text size="sm" ta="center" fw={600}>
            {t("home.architecture.api")}
          </Text>
        </Paper>
      </Stack>
    </SimpleGrid>
  );
}
