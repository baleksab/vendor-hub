import { PasswordInput, Select, TextInput, Textarea } from "@mantine/core";

import { isMessageKey } from "../../i18n";
import { useT } from "../../i18n/LocaleProvider";

type Option = { value: string; label: string };

type Props = {
  name: string;
  label: string;
  error?: string;
  defaultValue?: string;
  kind?: "text" | "password" | "select" | "textarea";
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  description?: string;
  options?: Option[];
  placeholder?: string;
};

export function FormField({
  name,
  label,
  error,
  defaultValue,
  kind = "text",
  type = "text",
  autoComplete,
  description,
  options,
  placeholder,
}: Props) {
  const t = useT();

  const common = {
    name,
    id: name,
    label,
    description,
    error: error !== undefined && isMessageKey(error) ? t(error) : error,
    defaultValue,
    autoComplete,
    withAsterisk: true,
    size: "md",
  } as const;

  if (kind === "select") {
    return <Select {...common} data={options ?? []} placeholder={placeholder} searchable />;
  }

  if (kind === "textarea") {
    return <Textarea {...common} autosize minRows={4} />;
  }

  if (kind === "password") {
    return <PasswordInput {...common} />;
  }

  return <TextInput {...common} type={type} />;
}
