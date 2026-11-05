import { Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
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
    <Stack component="section" gap="md" py={{ base: "lg", sm: "xl" }} maw={640}>
      <Title order={1} fz={{ base: 32, sm: 44 }}>
        {t("home.title")}
      </Title>
      <Text c="dimmed" fz={{ base: "md", sm: "lg" }}>
        {t("home.subtitle")}
      </Text>
      <Button
        component={Link}
        to="/remote-test"
        size="md"
        mih={44}
        w={{ base: "100%", sm: "auto" }}
        style={{ alignSelf: "flex-start" }}
      >
        {t("home.cta")}
      </Button>
    </Stack>
  );
}
