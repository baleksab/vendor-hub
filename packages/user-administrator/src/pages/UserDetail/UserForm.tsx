import { Alert, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ApiError } from "@vendor-hub/api-client";
import { FormField } from "@vendor-hub/ui";
import type { UpdateUserRequest, UserResponse } from "@vendor-hub/types";
import { useEffect, useState, type ReactNode } from "react";

import { useT } from "../../context/MessagesContext";
import { useCountries } from "../../hooks/useCountries";
import { useUpdateUser } from "../../hooks/useUpdateUser";

const SAVED_NOTICE_MS = 3000;

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
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!showSaved) {
      return;
    }

    const timer = setTimeout(() => setShowSaved(false), SAVED_NOTICE_MS);

    return () => clearTimeout(timer);
  }, [showSaved]);
  const form = useForm<FormValues>({ mode: "uncontrolled", initialValues: toValues(user) });

  const { options: loadedCountries } = useCountries();
  const countryOptions =
    loadedCountries.length > 0 ? loadedCountries : [{ value: user.country, label: user.country }];

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

  const handleDiscard = () => {
    form.reset();
    form.clearErrors();
    setAlert(null);
    mutation.reset();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const body = changedFields(user, values);

    setAlert(null);
    setShowSaved(false);
    mutation.reset();

    if (Object.keys(body).length === 0) {
      setAlert(t("user.form.noChanges"));

      return;
    }

    try {
      const updated = await mutation.mutateAsync(body);

      form.setInitialValues(toValues(updated));
      form.reset();
      setShowSaved(true);
    } catch (error) {
      handleError(error);
    }
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <Section
          title={t("user.section.account")}
          description={t("user.section.accountDescription")}
        >
          <FormField
            key={form.key("email")}
            label={t("user.form.email")}
            type="email"
            autoComplete="off"
            {...field("email")}
          />
          <FormField
            key={form.key("role")}
            label={t("user.form.role")}
            kind="select"
            options={roleOptions}
            {...field("role")}
          />
        </Section>

        <Section
          title={t("user.section.personal")}
          description={t("user.section.personalDescription")}
        >
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
        </Section>

        <Section
          title={t("user.section.contact")}
          description={t("user.section.contactDescription")}
        >
          <FormField
            key={form.key("phoneNumber")}
            label={t("user.form.phoneNumber")}
            type="tel"
            {...field("phoneNumber")}
          />
          <FormField
            key={form.key("country")}
            label={t("user.form.country")}
            kind="select"
            options={countryOptions}
            {...field("country")}
          />
          <FormField
            key={form.key("address")}
            label={t("user.form.address")}
            {...field("address")}
          />
        </Section>

        <Section
          title={t("user.section.security")}
          description={t("user.section.securityDescription")}
        >
          <FormField
            key={form.key("password")}
            label={t("user.form.password")}
            description={t("user.form.passwordHint")}
            kind="password"
            autoComplete="new-password"
            withAsterisk={false}
            {...field("password")}
          />
        </Section>

        {alert === null ? null : (
          <Alert color="red" role="alert">
            {alert}
          </Alert>
        )}
        {showSaved ? <Alert color="green">{t("user.form.saved")}</Alert> : null}

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={handleDiscard}
            disabled={!form.isDirty() || mutation.isPending}
          >
            {t("user.form.discard")}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!form.isDirty()}>
            {t("user.form.save")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={2} size="h4">
            {title}
          </Title>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </div>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {children}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
