import { Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import { useT } from "../../../i18n/LocaleProvider";
import classes from "./Features.module.scss";
import stepClasses from "./Steps.module.scss";

const steps = ["account", "vendor", "share"] as const;

export function Steps() {
  const t = useT();

  return (
    <Stack component="section" gap="xl" aria-labelledby="home-steps">
      <Title order={2} id="home-steps" fz={{ base: 28, sm: 36 }} className={classes.heading}>
        {t("home.steps.title")}
      </Title>

      <SimpleGrid
        component="ol"
        cols={{ base: 1, sm: 3 }}
        spacing="md"
        p={0}
        m={0}
        style={{ listStyle: "none" }}
      >
        {steps.map((step, index) => (
          <li key={step}>
            <Paper withBorder p="lg" h="100%" className={stepClasses.step}>
              <Stack gap="sm">
                <span className={stepClasses.number} aria-hidden>
                  {index + 1}
                </span>
                <Text fw={650} fz="lg">
                  {t(`home.step.${step}.title`)}
                </Text>
                <Text c="dimmed" size="sm">
                  {t(`home.step.${step}.text`)}
                </Text>
              </Stack>
            </Paper>
          </li>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
