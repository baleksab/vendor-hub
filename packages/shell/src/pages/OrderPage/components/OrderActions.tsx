import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { OrderResponse } from "@vendor-hub/types";
import { useEffect } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";

import { paymentPath } from "../../../cart/cartPaths";
import { FormAlert } from "../../../components/FormAlert/FormAlert";
import { FormField } from "../../../components/FormField/FormField";
import { useT } from "../../../i18n/LocaleProvider";
import type { action } from "../OrderPage";

export function OrderActions({ order }: { order: OrderResponse }) {
  const t = useT();
  const navigation = useNavigation();
  const result = useActionData<typeof action>();
  const [cancelOpened, cancelModal] = useDisclosure(false);
  const [returnOpened, returnModal] = useDisclosure(false);
  const busy = (intent: string) =>
    navigation.state === "submitting" && navigation.formData?.get("intent") === intent;
  const allowed = new Set(order.allowedActions);
  const succeeded = result !== undefined && "ok" in result;

  useEffect(() => {
    if (succeeded) {
      cancelModal.close();
      returnModal.close();
    }
  }, [succeeded, cancelModal, returnModal]);

  const failure = result !== undefined && "form" in result ? result : null;

  if (
    !["pay", "cancel", "confirmReceipt", "requestReturn"].some((name) => allowed.has(name as never))
  ) {
    return null;
  }

  return (
    <Stack gap="sm">
      {returnOpened ? null : <FormAlert message={failure?.form} />}

      <Group gap="sm">
        {allowed.has("pay") ? (
          <Button component={Link} to={paymentPath(order.id)} size="md" mih={44}>
            {t("order.pay")}
          </Button>
        ) : null}
        {allowed.has("confirmReceipt") ? (
          <Form method="post">
            <input type="hidden" name="intent" value="confirmReceipt" />
            <Button type="submit" size="md" mih={44} loading={busy("confirmReceipt")}>
              {t("order.confirmReceipt")}
            </Button>
          </Form>
        ) : null}
        {allowed.has("requestReturn") ? (
          <Button variant="default" size="md" mih={44} onClick={returnModal.open}>
            {t("order.requestReturn")}
          </Button>
        ) : null}
        {allowed.has("cancel") ? (
          <Button variant="subtle" color="red" size="md" mih={44} onClick={cancelModal.open}>
            {t("order.cancel")}
          </Button>
        ) : null}
      </Group>

      <Modal opened={cancelOpened} onClose={cancelModal.close} title={t("order.cancel")}>
        <Form method="post">
          <Stack>
            <Text size="sm">{t("order.cancelConfirm")}</Text>
            <input type="hidden" name="intent" value="cancel" />
            <Group justify="flex-end">
              <Button variant="default" mih={44} onClick={cancelModal.close}>
                {t("order.keep")}
              </Button>
              <Button type="submit" color="red" mih={44} loading={busy("cancel")}>
                {t("order.cancel")}
              </Button>
            </Group>
          </Stack>
        </Form>
      </Modal>

      <Modal opened={returnOpened} onClose={returnModal.close} title={t("order.requestReturn")}>
        <Form method="post" noValidate>
          <Stack>
            <input type="hidden" name="intent" value="requestReturn" />
            <FormField
              name="reason"
              kind="textarea"
              label={t("order.returnReason")}
              maxLength={1000}
              defaultValue={failure?.values.reason}
              error={failure?.fields.reason}
            />
            <FormAlert message={failure?.form} />
            <Group justify="flex-end">
              <Button type="submit" mih={44} loading={busy("requestReturn")}>
                {t("order.returnSubmit")}
              </Button>
            </Group>
          </Stack>
        </Form>
      </Modal>
    </Stack>
  );
}
