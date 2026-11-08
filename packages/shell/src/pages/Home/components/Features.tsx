import { Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import { useT } from "../../../i18n/LocaleProvider";
import classes from "./Features.module.scss";
import { FeatureIcon, type FeatureIconName } from "./icons";

const features = [
  { icon: "store", key: "pages" },
  { icon: "bolt", key: "fast" },
  { icon: "blocks", key: "modules" },
  { icon: "globe", key: "languages" },
] as const satisfies readonly { icon: FeatureIconName; key: string }[];

export function Features() {
  const t = useT();

  return (
    <Stack component="section" gap="xl" aria-labelledby="home-features">
      <Stack gap="xs" maw={640}>
        <Title order={2} id="home-features" fz={{ base: 28, sm: 36 }} className={classes.heading}>
          {t("home.features.title")}
        </Title>
        <Text c="dimmed" fz="lg">
          {t("home.features.subtitle")}
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {features.map(({ icon, key }) => (
          <Card key={key} withBorder padding="lg" className={classes.card}>
            <Stack gap="sm">
              <FeatureIcon name={icon} />
              <Text fw={650} fz="lg">
                {t(`home.feature.${key}.title`)}
              </Text>
              <Text c="dimmed" size="sm">
                {t(`home.feature.${key}.text`)}
              </Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
