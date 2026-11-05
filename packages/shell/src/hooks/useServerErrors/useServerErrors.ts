import { useState } from "react";

import { describeError, type ErrorContext } from "../../api/describeError";

export function useServerErrors(error: unknown, context: ErrorContext) {
  const [dismissed, setDismissed] = useState<{ error: unknown; fields: string[] }>({
    error: null,
    fields: [],
  });
  const description = error ? describeError(error, context) : null;
  const dismissedFields = dismissed.error === error ? dismissed.fields : [];

  return {
    formError: description?.form ?? null,
    fieldError: (name: string): string | null =>
      dismissedFields.includes(name) ? null : (description?.fields[name] ?? null),
    dismissField: (name: string) => {
      if (description?.fields[name] !== undefined && !dismissedFields.includes(name)) {
        setDismissed({ error, fields: [...dismissedFields, name] });
      }
    },
  };
}
