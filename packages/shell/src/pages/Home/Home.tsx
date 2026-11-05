import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import { VENDORS_PATH } from "../../vendor/vendorPaths";
import type { Route } from "./+types/Home";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.home.title",
    descriptionKey: "seo.home.description",
    path: "/",
  });
}

export default function Home() {
  const t = useT();

  return (
    <Stack
      component="section"
      gap="md"
      align="center"
      ta="center"
      maw={640}
      mx="auto"
      py={{ base: "xl", sm: 96 }}
    >
      <Title order={1} fz={{ base: 32, sm: 44 }}>
        {t("home.title")}
      </Title>
      <Text c="dimmed" fz={{ base: "md", sm: "lg" }}>
        {t("home.subtitle")}
      </Text>
      <Group justify="center">
        <Button component={Link} to={VENDORS_PATH} size="md" mih={44}>
          {t("home.browseVendors")}
        </Button>
        <Button component={Link} to="/remote-test" size="md" mih={44} variant="default">
          {t("home.cta")}
        </Button>
      </Group>
    </Stack>
  );
}
