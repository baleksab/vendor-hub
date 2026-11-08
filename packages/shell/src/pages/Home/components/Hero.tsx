import { Badge, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import { useT } from "../../../i18n/LocaleProvider";
import { VENDORS_PATH } from "../../../vendor/vendorPaths";
import classes from "./Hero.module.scss";
import { HeroIllustration } from "./HeroIllustration";

export function Hero() {
  const t = useT();

  return (
    <SimpleGrid
      component="section"
      className={classes.hero}
      cols={{ base: 1, md: 2 }}
      spacing={48}
      verticalSpacing={40}
    >
      <Stack gap="lg" justify="center">
        <Badge variant="light" size="lg" radius="xl" w="fit-content" tt="none">
          {t("home.eyebrow")}
        </Badge>
        <Title order={1} className={classes.title} fz={{ base: 38, sm: 52 }} lh={1.08}>
          {t("home.title")}
        </Title>
        <Text c="dimmed" fz={{ base: "md", sm: "lg" }} maw={560}>
          {t("home.subtitle")}
        </Text>
        <Group gap="sm">
          <Button component={Link} to={VENDORS_PATH} size="lg" radius="xl" mih={48}>
            {t("home.browseVendors")}
          </Button>
          <Button
            component={Link}
            to="/become-vendor"
            size="lg"
            radius="xl"
            mih={48}
            variant="default"
          >
            {t("home.becomeVendor")}
          </Button>
        </Group>
      </Stack>

      <HeroIllustration className={classes.illustration} />
    </SimpleGrid>
  );
}
