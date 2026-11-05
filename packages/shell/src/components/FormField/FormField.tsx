import { FormField as UiFormField } from "@vendor-hub/ui";
import type { ComponentProps } from "react";

import { isMessageKey } from "../../i18n";
import { useT } from "../../i18n/LocaleProvider";

type Props = Omit<ComponentProps<typeof UiFormField>, "errorText"> & { error?: string };

export function FormField({ error, ...props }: Props) {
  const t = useT();
  const errorText = error !== undefined && isMessageKey(error) ? t(error) : error;

  return <UiFormField {...props} errorText={errorText} />;
}
