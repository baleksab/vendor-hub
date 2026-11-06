import { Alert, Button, Group, Modal, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import type { VendorResponse } from "@vendor-hub/types";
import { useState } from "react";
import { useNavigate } from "react-router";

import { useT } from "../../context/MessagesContext";
import { useDeleteVendor } from "../../hooks/useDeleteVendor";
import { VENDORS_PATH } from "../../paths";

const FORBIDDEN = 403;

export function DeleteVendor({ vendor }: { vendor: VendorResponse }) {
  const t = useT();
  const navigate = useNavigate();
  const mutation = useDeleteVendor(vendor.id);
  const [opened, setOpened] = useState(false);
  const [typed, setTyped] = useState("");
  const [alert, setAlert] = useState<string | null>(null);

  const close = () => {
    setOpened(false);
    setTyped("");
    setAlert(null);
  };

  const handleDelete = async () => {
    setAlert(null);

    try {
      await mutation.mutateAsync();
      await navigate(VENDORS_PATH);
    } catch (error) {
      if (error instanceof ApiError && error.status === FORBIDDEN) {
        setAlert(t("danger.forbidden"));
      } else if (!(error instanceof ApiError && error.kind === "unauthorized")) {
        setAlert(t("danger.failed"));
      }
    }
  };

  return (
    <Paper withBorder radius="md" p="lg" style={{ borderColor: "var(--mantine-color-red-6)" }}>
      <Group justify="space-between" align="center" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h4">
            {t("danger.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("danger.description")}
          </Text>
        </Stack>
        <Button color="red" variant="outline" onClick={() => setOpened(true)}>
          {t("danger.button")}
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title={t("danger.confirmTitle", { name: vendor.name })}
        closeButtonProps={{ "aria-label": t("common.close") }}
      >
        <Stack gap="md">
          <Text size="sm">{t("danger.confirmText", { slug: vendor.slug })}</Text>
          <TextInput
            label={t("danger.confirmLabel")}
            value={typed}
            onChange={(event) => setTyped(event.currentTarget.value)}
            autoComplete="off"
            data-autofocus
          />
          {alert === null ? null : (
            <Alert color="red" role="alert">
              {alert}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={close} disabled={mutation.isPending}>
              {t("danger.cancel")}
            </Button>
            <Button
              color="red"
              onClick={() => void handleDelete()}
              loading={mutation.isPending}
              disabled={typed !== vendor.slug}
            >
              {t("danger.confirm")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
