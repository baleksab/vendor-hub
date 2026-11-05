import { Button, Stack, Text, Title } from "@mantine/core";
import { data, Link } from "react-router";

import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/NotFound";

export function loader() {
  return data(null, { status: 404 });
}

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.notFound.title",
    descriptionKey: "seo.notFound.description",
    path: "/",
    noindex: true,
  });
}

export default function NotFound() {
  const t = useT();

  return (
    <Stack component="section" gap="md" maw={640}>
      <Title order={1}>{t("notFound.title")}</Title>
      <Text c="dimmed">{t("notFound.message")}</Text>
      <Button component={Link} to="/" mih={44} style={{ alignSelf: "flex-start" }}>
        {t("notFound.back")}
      </Button>
    </Stack>
  );
}
