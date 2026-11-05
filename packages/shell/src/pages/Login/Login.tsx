import { Alert, Anchor, Button, Stack, Text, Title } from "@mantine/core";
import { Form, Link, useNavigation, useSearchParams } from "react-router";

import { redirectIfAuthenticated } from "../../auth/session.server";
import { FormAlert } from "../../components/FormAlert/FormAlert";
import { FormField } from "../../components/FormField/FormField";
import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/Login";
import { loginAction } from "./loginAction.server";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.login.title",
    descriptionKey: "seo.login.description",
    path: "/login",
    noindex: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfAuthenticated(request);

  return null;
}

export function action({ request }: Route.ActionArgs) {
  return loginAction(request);
}

export default function Login({ actionData }: Route.ComponentProps) {
  const t = useT();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const registerTo = redirectTo
    ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/register";

  return (
    <Stack component="section" gap="md" py={{ base: "md", sm: "xl" }} maw={420} mx="auto">
      <Title order={1}>{t("login.title")}</Title>

      {searchParams.has("registered") && <Alert color="green">{t("login.registered")}</Alert>}

      <Form method="post" noValidate>
        <Stack gap="md">
          <FormField
            name="email"
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            defaultValue={actionData?.values.email}
            error={actionData?.fields.email}
          />
          <FormField
            name="password"
            label={t("auth.password")}
            kind="password"
            autoComplete="current-password"
            error={actionData?.fields.password}
          />

          <FormAlert message={actionData?.form} />

          <Button type="submit" size="md" mih={44} loading={navigation.state === "submitting"}>
            {t("login.submit")}
          </Button>
        </Stack>
      </Form>

      <Text c="dimmed">
        {t("login.noAccount")}{" "}
        <Anchor component={Link} to={registerTo}>
          {t("nav.register")}
        </Anchor>
      </Text>
    </Stack>
  );
}
