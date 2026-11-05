import { Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import { useT } from "../../../i18n/LocaleProvider";
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
    <Stack component="section" gap="lg" aria-labelledby="home-features">
      <Stack gap={4}>
        <Title order={2} id="home-features">
          {t("home.features.title")}
        </Title>
        <Text c="dimmed">{t("home.features.subtitle")}</Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {features.map(({ icon, key }) => (
          <Card key={key}>
            <Stack gap="sm">
              <FeatureIcon name={icon} />
              <Text fw={600}>{t(`home.feature.${key}.title`)}</Text>
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
