import { Badge, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import { useT } from "../../../i18n/LocaleProvider";
import { VENDORS_PATH } from "../../../vendor/vendorPaths";
import { HeroIllustration } from "./HeroIllustration";

export function Hero() {
  const t = useT();

  return (
    <SimpleGrid component="section" cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
      <Stack gap="md" justify="center">
        <Badge variant="light" size="lg" w="fit-content">
          {t("home.eyebrow")}
        </Badge>
        <Title order={1} fz={{ base: 30, sm: 40 }} lh={1.15}>
          {t("home.title")}
        </Title>
        <Text c="dimmed" fz={{ base: "md", sm: "lg" }}>
          {t("home.subtitle")}
        </Text>
        <Group>
          <Button component={Link} to={VENDORS_PATH} size="md" mih={44}>
            {t("home.browseVendors")}
          </Button>
          <Button component={Link} to="/become-vendor" size="md" mih={44} variant="default">
            {t("home.becomeVendor")}
          </Button>
        </Group>
      </Stack>

      <HeroIllustration />
    </SimpleGrid>
  );
}
