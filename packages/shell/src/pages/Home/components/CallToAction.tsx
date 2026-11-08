import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import { useT } from "../../../i18n/LocaleProvider";
import { VENDORS_PATH } from "../../../vendor/vendorPaths";
import classes from "./CallToAction.module.scss";

export function CallToAction() {
  const t = useT();

  return (
    <section className={classes.band}>
      <Stack gap="lg" align="center" ta="center" maw={620} mx="auto">
        <Stack gap="xs">
          <Title order={2} fz={{ base: 28, sm: 38 }} c="white" className={classes.title}>
            {t("home.cta.title")}
          </Title>
          <Text fz="lg" c="rgba(255,255,255,0.8)">
            {t("home.cta.text")}
          </Text>
        </Stack>
        <Group justify="center" gap="sm">
          <Button
            component={Link}
            to="/become-vendor"
            size="lg"
            radius="xl"
            mih={48}
            color="white"
            c="brand.8"
          >
            {t("home.becomeVendor")}
          </Button>
          <Button
            component={Link}
            to={VENDORS_PATH}
            size="lg"
            radius="xl"
            mih={48}
            variant="outline"
            color="white"
          >
            {t("home.browseVendors")}
          </Button>
        </Group>
      </Stack>
    </section>
  );
}
