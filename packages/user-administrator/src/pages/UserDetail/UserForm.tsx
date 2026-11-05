import { Alert, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ApiError } from "@vendor-hub/api-client";
import { FormField } from "@vendor-hub/ui";
import type { UpdateUserRequest, UserResponse } from "@vendor-hub/types";
import { useState } from "react";

import { useT } from "../../context/MessagesContext";
import { useUpdateUser } from "../../hooks/useUpdateUser";

const PLAIN_FIELDS = [
  "email",
  "firstName",
  "lastName",
  "address",
  "phoneNumber",
  "country",
  "role",
] as const;

type FormValues = Record<(typeof PLAIN_FIELDS)[number], string> & { password: string };

function toValues(user: UserResponse): FormValues {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    address: user.address,
    phoneNumber: user.phoneNumber,
    country: user.country,
    role: user.role,
    password: "",
  };
}

function changedFields(user: UserResponse, values: FormValues): UpdateUserRequest {
  const body: Record<string, string> = {};

  for (const field of PLAIN_FIELDS) {
    if (values[field] !== user[field]) {
      body[field] = values[field];
    }
  }

  if (values.password !== "") {
    body["password"] = values.password;
  }

  return body as UpdateUserRequest;
}

export function UserForm({ user }: { user: UserResponse }) {
  const t = useT();
  const mutation = useUpdateUser(user.id);
  const [alert, setAlert] = useState<string | null>(null);
  const form = useForm<FormValues>({ mode: "uncontrolled", initialValues: toValues(user) });

  const roleOptions = [
    { value: "administrator", label: t("role.administrator") },
    { value: "regular", label: t("role.regular") },
  ];

  const field = (name: keyof FormValues) => {
    const { error, ...inputProps } = form.getInputProps(name);

    return {
      ...inputProps,
      name,
      errorText: typeof error === "string" ? error : undefined,
    };
  };

  const handleError = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      setAlert(t("user.form.failed"));

      return;
    }

    if (error.kind === "validation" && Object.keys(error.fieldErrors).length > 0) {
      form.setErrors(error.fieldErrors);
    } else if (error.kind === "validation") {
      setAlert(`${t("user.form.rejected")} ${error.detail}`.trim());
    } else if (error.kind === "conflict") {
      form.setFieldError("email", t("user.form.conflict"));
    } else if (error.kind !== "unauthorized") {
      setAlert(t("user.form.failed"));
    }
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const body = changedFields(user, values);

    setAlert(null);
    mutation.reset();

    if (Object.keys(body).length === 0) {
      setAlert(t("user.form.noChanges"));

      return;
    }

    try {
      await mutation.mutateAsync(body);
      form.setFieldValue("password", "");
    } catch (error) {
      handleError(error);
    }
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md" maw={520}>
        <FormField
          key={form.key("email")}
          label={t("user.form.email")}
          type="email"
          autoComplete="off"
          {...field("email")}
        />
        <FormField
          key={form.key("firstName")}
          label={t("user.form.firstName")}
          {...field("firstName")}
        />
        <FormField
          key={form.key("lastName")}
          label={t("user.form.lastName")}
          {...field("lastName")}
        />
        <FormField key={form.key("address")} label={t("user.form.address")} {...field("address")} />
        <FormField
          key={form.key("phoneNumber")}
          label={t("user.form.phoneNumber")}
          type="tel"
          {...field("phoneNumber")}
        />
        <FormField
          key={form.key("country")}
          label={t("user.form.country")}
          maxLength={2}
          {...field("country")}
        />
        <FormField
          key={form.key("role")}
          label={t("user.form.role")}
          kind="select"
          options={roleOptions}
          {...field("role")}
        />
        <FormField
          key={form.key("password")}
          label={t("user.form.password")}
          description={t("user.form.passwordHint")}
          kind="password"
          autoComplete="new-password"
          withAsterisk={false}
          {...field("password")}
        />

        {alert === null ? null : (
          <Alert color="red" role="alert">
            {alert}
          </Alert>
        )}
        {mutation.isSuccess ? <Alert color="green">{t("user.form.saved")}</Alert> : null}

        <Button type="submit" loading={mutation.isPending} h={{ base: 44, sm: 34 }}>
          {t("user.form.save")}
        </Button>
      </Stack>
    </form>
  );
}
