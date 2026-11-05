import { Alert, Button, Stack } from "@mantine/core";
import { revalidateLogic, useForm } from "@tanstack/react-form";

import { FormField } from "../../../components/FormField/FormField";
import { useIsClient } from "../../../hooks/useIsClient/useIsClient";
import { useLoginMutation } from "../../../hooks/useLoginMutation/useLoginMutation";
import { useServerErrors } from "../../../hooks/useServerErrors/useServerErrors";
import { isMessageKey } from "../../../i18n";
import { useT } from "../../../i18n/LocaleProvider";
import { loginSchema } from "../../../auth/schemas";

export function LoginForm() {
  const t = useT();
  const isClient = useIsClient();
  const mutation = useLoginMutation();
  const { formError } = useServerErrors(mutation.error, "login");

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validationLogic: revalidateLogic({ mode: "change", modeAfterSubmission: "change" }),
    validators: { onDynamic: loginSchema },
    onSubmit: ({ value }) => {
      mutation.mutate(loginSchema.parse(value));
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
            <form.Field name="email">
              {(field) => (
                <FormField
                  field={field}
                  label={t("auth.email")}
                  type="email"
                  autoComplete="email"
                  submitted={submitted}
                />
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <FormField
                  field={field}
                  label={t("auth.password")}
                  kind="password"
                  autoComplete="current-password"
                  submitted={submitted}
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
              {t("login.submit")}
            </Button>
          </Stack>
        )}
      </form.Subscribe>
    </form>
  );
}
