import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import { useT } from "../../../i18n/LocaleProvider";
import { VENDORS_PATH } from "../../../vendor/vendorPaths";

export function CallToAction() {
  const t = useT();

  return (
    <Paper
      component="section"
      withBorder
      p={{ base: "lg", sm: "xl" }}
      radius="md"
      bg="var(--mantine-color-default-hover)"
    >
      <Stack gap="md" align="flex-start">
        <Stack gap={4}>
          <Title order={2}>{t("home.cta.title")}</Title>
          <Text c="dimmed">{t("home.cta.text")}</Text>
        </Stack>
        <Group>
          <Button component={Link} to="/become-vendor" size="md" mih={44}>
            {t("home.becomeVendor")}
          </Button>
          <Button component={Link} to={VENDORS_PATH} size="md" mih={44} variant="default">
            {t("home.browseVendors")}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
