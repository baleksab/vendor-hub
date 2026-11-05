import { Alert, Button, SimpleGrid, Stack } from "@mantine/core";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useMemo } from "react";

import { FormField } from "../../../components/FormField/FormField";
import { useIsClient } from "../../../hooks/useIsClient/useIsClient";
import { useRegisterMutation } from "../../../hooks/useRegisterMutation/useRegisterMutation";
import { useServerErrors } from "../../../hooks/useServerErrors/useServerErrors";
import { isMessageKey } from "../../../i18n";
import { useLocale, useT } from "../../../i18n/LocaleProvider";
import { createRegisterSchema, toCreateUserRequest } from "../../../auth/schemas";

const defaultValues = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  address: "",
  phoneNumber: "",
  country: "",
};

export function RegisterForm({ countries }: { countries: string[] }) {
  const t = useT();
  const locale = useLocale();
  const isClient = useIsClient();
  const mutation = useRegisterMutation();
  const { formError, fieldError, dismissField } = useServerErrors(mutation.error, "register");

  const schema = useMemo(() => createRegisterSchema(countries), [countries]);
  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });

    return countries
      .map((code) => ({ value: code, label: names.of(code) ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [countries, locale]);

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic({ mode: "change", modeAfterSubmission: "change" }),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => {
      mutation.mutate(toCreateUserRequest(schema.parse(value)));
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Subscribe selector={(state) => state.submissionAttempts > 0}>
        {(submitted) => (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <form.Field name="firstName">
                {(field) => (
                  <FormField
                    submitted={submitted}
                    onEdit={dismissField}
                    field={field}
                    label={t("auth.firstName")}
                    autoComplete="given-name"
                    serverError={fieldError("firstName")}
                  />
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <FormField
                    submitted={submitted}
                    onEdit={dismissField}
                    field={field}
                    label={t("auth.lastName")}
                    autoComplete="family-name"
                    serverError={fieldError("lastName")}
                  />
                )}
              </form.Field>
            </SimpleGrid>

            <form.Field name="email">
              {(field) => (
                <FormField
                  submitted={submitted}
                  onEdit={dismissField}
                  field={field}
                  label={t("auth.email")}
                  type="email"
                  autoComplete="email"
                  serverError={fieldError("email")}
                />
              )}
            </form.Field>

            <form.Field name="phoneNumber">
              {(field) => (
                <FormField
                  submitted={submitted}
                  onEdit={dismissField}
                  field={field}
                  label={t("auth.phoneNumber")}
                  description={t("auth.phoneHint")}
                  type="tel"
                  autoComplete="tel"
                  serverError={fieldError("phoneNumber")}
                />
              )}
            </form.Field>

            <form.Field name="address">
              {(field) => (
                <FormField
                  submitted={submitted}
                  onEdit={dismissField}
                  field={field}
                  label={t("auth.address")}
                  autoComplete="street-address"
                  serverError={fieldError("address")}
                />
              )}
            </form.Field>

            <form.Field name="country">
              {(field) => (
                <FormField
                  submitted={submitted}
                  onEdit={dismissField}
                  field={field}
                  label={t("auth.country")}
                  kind="select"
                  options={options}
                  placeholder={t("auth.countryPlaceholder")}
                  autoComplete="country"
                  serverError={fieldError("country")}
                />
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <FormField
                  submitted={submitted}
                  onEdit={dismissField}
                  field={field}
                  label={t("auth.password")}
                  kind="password"
                  autoComplete="new-password"
                  serverError={fieldError("password")}
                />
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <FormField
                  submitted={submitted}
                  onEdit={dismissField}
                  field={field}
                  label={t("auth.confirmPassword")}
                  kind="password"
                  autoComplete="new-password"
                />
              )}
            </form.Field>

            {formError !== null && (
              <Alert color="red" role="alert">
                {isMessageKey(formError) ? t(formError) : formError}
              </Alert>
            )}

            <Button
              type="submit"
              size="md"
              mih={44}
              disabled={!isClient}
              loading={mutation.isPending}
            >
              {t("register.submit")}
            </Button>
          </Stack>
        )}
      </form.Subscribe>
    </form>
  );
}
