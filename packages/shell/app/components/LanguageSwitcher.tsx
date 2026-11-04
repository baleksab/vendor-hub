import { Button } from "@mantine/core";
import { Form } from "react-router";

import { useLocale, useT } from "../i18n/LocaleProvider";
import { LOCALES } from "../i18n/locales";

export function LanguageSwitcher() {
  const t = useT();
  const current = useLocale();

  return (
    <Form method="post" action="/locale" aria-label={t("language.label")}>
      <Button.Group>
        {LOCALES.map((locale) => (
          <Button
            key={locale}
            type="submit"
            name="locale"
            value={locale}
            size="compact-sm"
            variant={locale === current ? "filled" : "default"}
            aria-pressed={locale === current}
          >
            {locale.toUpperCase()}
          </Button>
        ))}
      </Button.Group>
    </Form>
  );
}
