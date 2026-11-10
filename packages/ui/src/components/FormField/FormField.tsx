import { PasswordInput, Select, TextInput, Textarea } from "@mantine/core";
import type { ChangeEvent, FocusEventHandler } from "react";

type Option = { value: string; label: string };

const INPUT_WRAPPER_ORDER: ("label" | "input" | "description" | "error")[] = [
  "label",
  "input",
  "description",
  "error",
];

type Props = {
  name: string;
  label: string;
  errorText?: string;
  defaultValue?: string;
  value?: string;
  kind?: "text" | "password" | "select" | "textarea";
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  description?: string;
  options?: Option[];
  placeholder?: string;
  maxLength?: number;
  withAsterisk?: boolean;
  onChange?: (
    eventOrValue: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string | null,
  ) => void;
  onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export function FormField({
  name,
  label,
  errorText,
  defaultValue,
  value,
  kind = "text",
  type = "text",
  autoComplete,
  description,
  options,
  placeholder,
  maxLength,
  withAsterisk = true,
  onChange,
  onFocus,
  onBlur,
}: Props) {
  const common = {
    name,
    id: name,
    label,
    description,
    error: errorText,
    defaultValue,
    value,
    autoComplete,
    withAsterisk,
    onChange,
    onFocus,
    onBlur,
    size: "md",
    inputWrapperOrder: INPUT_WRAPPER_ORDER,
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

  return <TextInput {...common} type={type} maxLength={maxLength} />;
}
