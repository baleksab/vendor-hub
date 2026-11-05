import { AppShell, Container, Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

import { useT } from "../../i18n/LocaleProvider";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";

export function VendorSiteLayout({ children }: { children: ReactNode }) {
  const t = useT();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="md" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Text fw={700}>{t("app.title")}</Text>
            <LanguageSwitcher />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
