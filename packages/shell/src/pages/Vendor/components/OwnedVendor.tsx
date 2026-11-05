import { Anchor, Button, Card, Group, List, Stack, Text, Title } from "@mantine/core";
import { Form, useNavigation } from "react-router";

import type { VendorResponse } from "@vendor-hub/types";
import { FormAlert } from "../../../components/FormAlert/FormAlert";
import { FormField } from "../../../components/FormField/FormField";
import type { FormErrors } from "../../../forms/formErrors.server";
import { useT } from "../../../i18n/LocaleProvider";

type Props = {
  vendor: VendorResponse;
  siteUrl: string;
  ownerId: string;
  actionData: FormErrors | undefined;
};

export function OwnedVendor({ vendor, siteUrl, ownerId, actionData }: Props) {
  const t = useT();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const isAdding = navigation.formData?.get("intent") === "add";
  const addFailed = actionData?.fields.email !== undefined || actionData?.values.intent === "add";

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Title order={1}>{vendor.name}</Title>
        <Text c="dimmed">{vendor.description}</Text>
        <Anchor href={siteUrl} mih={44} style={{ display: "inline-flex", alignItems: "center" }}>
          {t("vendor.openSite")}
        </Anchor>
      </Stack>

      <Stack gap="xs" component="section" aria-labelledby="members-title">
        <Title order={2} id="members-title" fz="lg">
          {t("vendor.members")}
        </Title>
        <List listStyleType="none" spacing="xs">
          {vendor.members.map((member) => {
            const name = `${member.firstName} ${member.lastName}`;

            return (
              <List.Item key={member.userId}>
                <Group justify="space-between" wrap="nowrap" mih={44}>
                  <Text>
                    {name}{" "}
                    <Text span c="dimmed">
                      ({t(member.role === "owner" ? "vendor.role.owner" : "vendor.role.operator")})
                    </Text>
                  </Text>
                  {member.userId !== ownerId && (
                    <Form method="post">
                      <input type="hidden" name="intent" value="remove" />
                      <input type="hidden" name="userId" value={member.userId} />
                      <Button
                        type="submit"
                        variant="default"
                        size="md"
                        mih={44}
                        disabled={submitting}
                        aria-label={`${t("vendorPage.remove")} ${name}`}
                      >
                        {t("vendorPage.remove")}
                      </Button>
                    </Form>
                  )}
                </Group>
              </List.Item>
            );
          })}
        </List>
        {!addFailed && <FormAlert message={actionData?.form} />}
      </Stack>

      <Card withBorder component="section" aria-labelledby="add-operator-title">
        <Form method="post" noValidate key={vendor.members.length}>
          <Stack gap="md">
            <Title order={2} id="add-operator-title" fz="lg">
              {t("vendorPage.addOperator")}
            </Title>
            <input type="hidden" name="intent" value="add" />
            <FormField
              name="email"
              label={t("auth.email")}
              description={t("vendorPage.addOperatorHint")}
              type="email"
              autoComplete="off"
              defaultValue={addFailed ? actionData?.values.email : undefined}
              error={addFailed ? actionData?.fields.email : undefined}
            />
            {addFailed && <FormAlert message={actionData?.form} />}
            <Button type="submit" size="md" mih={44} loading={isAdding}>
              {t("vendorPage.addOperatorSubmit")}
            </Button>
          </Stack>
        </Form>
      </Card>
    </Stack>
  );
}
