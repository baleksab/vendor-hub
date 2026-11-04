import { Title } from "@mantine/core";

import { useT } from "../i18n/LocaleProvider";

export default function Home() {
  const t = useT();

  return <Title order={1}>{t("home.title")}</Title>;
}
