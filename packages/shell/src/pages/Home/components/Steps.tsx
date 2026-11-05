import { Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";

import { useT } from "../../../i18n/LocaleProvider";

const steps = ["account", "vendor", "share"] as const;

export function Steps() {
  const t = useT();

  return (
    <Stack component="section" gap="lg" aria-labelledby="home-steps">
      <Title order={2} id="home-steps">
        {t("home.steps.title")}
      </Title>

      <SimpleGrid
        component="ol"
        cols={{ base: 1, sm: 3 }}
        p={0}
        m={0}
        style={{ listStyle: "none" }}
      >
        {steps.map((step, index) => (
          <li key={step}>
            <Group align="flex-start" wrap="nowrap" gap="sm">
              <ThemeIcon variant="filled" radius="xl" size={32} aria-hidden>
                {index + 1}
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={600}>{t(`home.step.${step}.title`)}</Text>
                <Text c="dimmed" size="sm">
                  {t(`home.step.${step}.text`)}
                </Text>
              </Stack>
            </Group>
          </li>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
