import { FormAlert as UiFormAlert } from "@vendor-hub/ui";

import { isMessageKey } from "../../i18n";
import { useT } from "../../i18n/LocaleProvider";

export function FormAlert({ message }: { message: string | null | undefined }) {
  const t = useT();
  const messageText = message && isMessageKey(message) ? t(message) : message;

  return <UiFormAlert messageText={messageText} />;
}
