import { Button } from "@mantine/core";
import { Form } from "react-router";

import { useLocale, useT } from "../../i18n/LocaleProvider";
import { LOCALES } from "../../i18n/locales";

export function LanguageSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const t = useT();
  const current = useLocale();

  return (
    <Form method="post" action="/locale" aria-label={t("language.label")}>
      <Button.Group w={fullWidth ? "100%" : undefined}>
        {LOCALES.map((locale) => (
          <Button
            key={locale}
            type="submit"
            name="locale"
            value={locale}
            size="compact-sm"
            h={fullWidth ? 44 : { base: 44, md: 32 }}
            px="sm"
            flex={fullWidth ? 1 : undefined}
            variant={locale === current ? "light" : "default"}
            fw={600}
            aria-pressed={locale === current}
          >
            {locale.toUpperCase()}
          </Button>
        ))}
      </Button.Group>
    </Form>
  );
}
