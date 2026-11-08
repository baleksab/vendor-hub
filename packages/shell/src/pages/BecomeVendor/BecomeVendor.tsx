import { Button, Group, SimpleGrid, Stack, Title } from "@mantine/core";
import { Form, redirect, useNavigation } from "react-router";

import { requireUser } from "../../auth/session.server";
import { FormAlert } from "../../components/FormAlert/FormAlert";
import { FormField } from "../../components/FormField/FormField";
import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import { loadMyVendors } from "../../vendor/myVendors.server";
import { vendorPath } from "../../vendor/vendorPaths";
import type { Route } from "./+types/BecomeVendor";
import { becomeVendorAction } from "./becomeVendorAction.server";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.becomeVendor.title",
    descriptionKey: "seo.becomeVendor.description",
    path: "/become-vendor",
    noindex: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireUser(request);
  const { owned } = await loadMyVendors(request, session);

  if (owned !== null) {
    console.log(owned.slug);
    throw redirect(vendorPath(owned.slug));
  }

  return null;
}

export function action({ request }: Route.ActionArgs) {
  return becomeVendorAction(request);
}

export default function BecomeVendor({ actionData }: Route.ComponentProps) {
  const t = useT();
  const navigation = useNavigation();
  const values = actionData?.values;
  const fields = actionData?.fields;

  return (
    <Stack component="section" gap="md">
      <Title order={1}>{t("becomeVendor.title")}</Title>

      <Form method="post" noValidate>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <FormField
              name="slug"
              label={t("vendor.slug")}
              description={t("vendor.slugHint")}
              autoComplete="off"
              defaultValue={values?.slug}
              error={fields?.slug}
            />
            <FormField
              name="name"
              label={t("vendor.name")}
              autoComplete="organization"
              defaultValue={values?.name}
              error={fields?.name}
            />
          </SimpleGrid>
          <FormField
            name="description"
            label={t("vendor.description")}
            kind="textarea"
            defaultValue={values?.description}
            error={fields?.description}
          />

          <FormAlert message={actionData?.form} />

          <Group>
            <Button type="submit" size="md" mih={44} loading={navigation.state === "submitting"}>
              {t("becomeVendor.submit")}
            </Button>
          </Group>
        </Stack>
      </Form>
    </Stack>
  );
}
