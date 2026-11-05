import { Alert } from "@mantine/core";

import { isMessageKey } from "../../i18n";
import { useT } from "../../i18n/LocaleProvider";

export function FormAlert({ message }: { message: string | null | undefined }) {
  const t = useT();

  if (!message) {
    return null;
  }

  return (
    <Alert color="red" role="alert">
      {isMessageKey(message) ? t(message) : message}
    </Alert>
  );
}
