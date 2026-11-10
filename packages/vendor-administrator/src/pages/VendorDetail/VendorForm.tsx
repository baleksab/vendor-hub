import { Alert, Button, Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ApiError } from "@vendor-hub/api-client";
import type { UpdateVendorRequest, VendorResponse } from "@vendor-hub/types";
import { FormField } from "@vendor-hub/ui";
import { useEffect, useState } from "react";

import { SeoSection } from "../../components/SeoSection";
import { useT } from "../../context/MessagesContext";
import { useUpdateVendor } from "../../hooks/useUpdateVendor";
import { vendorSitePath } from "../../paths";

const SAVED_NOTICE_MS = 3000;

type FormValues = {
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

function toValues(vendor: VendorResponse): FormValues {
  return {
    name: vendor.name,
    description: vendor.description,
    seoTitle: vendor.seoTitle ?? "",
    seoDescription: vendor.seoDescription ?? "",
  };
}

function seoValue(value: string): string | null {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function changedFields(vendor: VendorResponse, values: FormValues): UpdateVendorRequest {
  const body: UpdateVendorRequest = {};

  if (values.name !== vendor.name) {
    body.name = values.name;
  }

  if (values.description !== vendor.description) {
    body.description = values.description;
  }

  if (seoValue(values.seoTitle) !== vendor.seoTitle) {
    body.seoTitle = seoValue(values.seoTitle);
  }

  if (seoValue(values.seoDescription) !== vendor.seoDescription) {
    body.seoDescription = seoValue(values.seoDescription);
  }

  return body;
}

export function VendorForm({ vendor }: { vendor: VendorResponse }) {
  const t = useT();
  const mutation = useUpdateVendor(vendor.id);
  const [alert, setAlert] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const form = useForm<FormValues>({ initialValues: toValues(vendor) });
  const values = form.getValues();
  const errors = form.errors;

  useEffect(() => {
    if (!showSaved) {
      return;
    }

    const timer = setTimeout(() => setShowSaved(false), SAVED_NOTICE_MS);

    return () => clearTimeout(timer);
  }, [showSaved]);

  const field = (name: keyof FormValues) => {
    const { error, ...inputProps } = form.getInputProps(name);

    return { ...inputProps, name, errorText: typeof error === "string" ? error : undefined };
  };

  const handleError = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      setAlert(t("vendor.form.failed"));

      return;
    }

    if (error.kind === "validation" && Object.keys(error.fieldErrors).length > 0) {
      form.setErrors(error.fieldErrors);
    } else if (error.kind === "validation") {
      setAlert(`${t("vendor.form.rejected")} ${error.detail}`.trim());
    } else if (error.kind !== "unauthorized") {
      setAlert(t("vendor.form.failed"));
    }
  };

  const handleDiscard = () => {
    form.reset();
    form.clearErrors();
    setAlert(null);
    mutation.reset();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const body = changedFields(vendor, values);

    setAlert(null);
    setShowSaved(false);
    mutation.reset();

    if (Object.keys(body).length === 0) {
      setAlert(t("vendor.form.noChanges"));

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
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <div>
            <Title order={2} size="h4">
              {t("vendor.form.title")}
            </Title>
            <Text size="sm" c="dimmed">
              {t("vendor.form.description")}
            </Text>
          </div>

          <TextInput
            label={t("vendor.form.slug")}
            description={t("vendor.form.slugHint")}
            value={vendor.slug}
            readOnly
            size="md"
          />
          <FormField key={form.key("name")} label={t("vendor.form.name")} {...field("name")} />
          <FormField
            key={form.key("description")}
            label={t("vendor.form.about")}
            kind="textarea"
            {...field("description")}
          />

          <SeoSection
            title={values.seoTitle}
            description={values.seoDescription}
            onTitleChange={(value) => form.setFieldValue("seoTitle", value)}
            onDescriptionChange={(value) => form.setFieldValue("seoDescription", value)}
            fallbackTitle={values.name.trim() === "" ? vendor.name : values.name.trim()}
            fallbackDescription={values.description}
            url={new URL(vendorSitePath(vendor.slug), window.location.origin).toString()}
            siteName={vendor.name}
            titleError={typeof errors.seoTitle === "string" ? errors.seoTitle : undefined}
            descriptionError={
              typeof errors.seoDescription === "string" ? errors.seoDescription : undefined
            }
          />

          {alert === null ? null : (
            <Alert color="red" role="alert">
              {alert}
            </Alert>
          )}
          {showSaved ? <Alert color="green">{t("vendor.form.saved")}</Alert> : null}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={handleDiscard}
              disabled={!form.isDirty() || mutation.isPending}
            >
              {t("vendor.form.discard")}
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={!form.isDirty()}>
              {t("vendor.form.save")}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </form>
  );
}
