import { PasswordInput, Select, TextInput } from "@mantine/core";

import { isMessageKey } from "../../i18n";
import { useT } from "../../i18n/LocaleProvider";

export type FieldLike = {
  name: string;
  state: { value: string; meta: { errors: unknown[]; isBlurred: boolean } };
  handleChange: (value: string) => void;
  handleBlur: () => void;
  validate: (cause: "change") => unknown;
};

type Option = { value: string; label: string };

type Props = {
  field: FieldLike;
  label: string;
  submitted: boolean;
  serverError?: string | null;
  onEdit?: (name: string) => void;
  kind?: "text" | "password" | "select";
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  description?: string;
  options?: Option[];
  placeholder?: string;
  disabled?: boolean;
};

function issueMessage(issue: unknown): string | null {
  if (typeof issue === "string") {
    return issue;
  }

  if (typeof issue === "object" && issue !== null && "message" in issue) {
    return typeof issue.message === "string" ? issue.message : null;
  }

  return null;
}

export function FormField({
  field,
  label,
  submitted,
  serverError,
  onEdit,
  kind = "text",
  type = "text",
  autoComplete,
  description,
  options,
  placeholder,
  disabled,
}: Props) {
  const t = useT();
  const { value, meta } = field.state;
  const localError = meta.isBlurred || submitted ? issueMessage(meta.errors[0]) : null;
  const handleBlur = () => {
    field.handleBlur();
    void field.validate("change");
  };
  const raw = localError ?? serverError ?? null;
  const error = raw !== null && isMessageKey(raw) ? t(raw) : raw;

  const common = {
    label,
    description,
    error,
    name: field.name,
    id: field.name,
    value,
    onBlur: handleBlur,
    disabled,
    withAsterisk: true,
    size: "md",
  } as const;

  if (kind === "select") {
    return (
      <Select
        {...common}
        data={options ?? []}
        placeholder={placeholder}
        searchable
        nothingFoundMessage="-"
        autoComplete={autoComplete}
        onChange={(next) => {
          onEdit?.(field.name);
          field.handleChange(next ?? "");
        }}
      />
    );
  }

  const Input = kind === "password" ? PasswordInput : TextInput;

  return (
    <Input
      {...common}
      type={kind === "password" ? undefined : type}
      autoComplete={autoComplete}
      onChange={(event) => {
        onEdit?.(field.name);
        field.handleChange(event.currentTarget.value);
      }}
    />
  );
}
