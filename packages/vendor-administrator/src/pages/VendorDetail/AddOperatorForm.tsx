import { Alert, Button, Group, Paper, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ApiError } from "@vendor-hub/api-client";
import { FormField } from "@vendor-hub/ui";
import { useState } from "react";

import { useT } from "../../context/MessagesContext";
import { useAddOperator } from "../../hooks/useAddOperator";

const NOT_FOUND = 404;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function AddOperatorForm({ vendorId }: { vendorId: string }) {
  const t = useT();
  const mutation = useAddOperator(vendorId);
  const [alert, setAlert] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { email: "" },
    validate: {
      email: (value) => (EMAIL_PATTERN.test(value.trim()) ? null : t("operator.invalid")),
    },
  });

  const { error, ...emailProps } = form.getInputProps("email");

  const handleError = (cause: unknown) => {
    if (!(cause instanceof ApiError)) {
      setAlert(t("operator.failed"));
    } else if (cause.status === NOT_FOUND) {
      form.setFieldError("email", t("operator.notFound"));
    } else if (cause.kind === "conflict") {
      form.setFieldError("email", t("operator.conflict"));
    } else if (cause.kind === "validation") {
      form.setFieldError("email", t("operator.invalid"));
    } else if (cause.kind !== "unauthorized") {
      setAlert(t("operator.failed"));
    }
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setAlert(null);
    setAdded(false);

    try {
      await mutation.mutateAsync(values.email.trim());
      form.reset();
      setAdded(true);
    } catch (cause) {
      handleError(cause);
    }
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group align="flex-end" wrap="wrap">
            <div style={{ flex: "1 1 240px" }}>
              <FormField
                key={form.key("email")}
                label={t("operator.email")}
                type="email"
                autoComplete="off"
                withAsterisk={false}
                {...emailProps}
                name="email"
                errorText={typeof error === "string" ? error : undefined}
              />
            </div>
            <Button type="submit" size="md" loading={mutation.isPending}>
              {t("operator.add")}
            </Button>
          </Group>
          {alert === null ? null : (
            <Alert color="red" role="alert">
              {alert}
            </Alert>
          )}
          {added ? <Alert color="green">{t("operator.added")}</Alert> : null}
        </Stack>
      </Paper>
    </form>
  );
}
