import { Alert, Anchor, Stack, Text, Title } from "@mantine/core";
import { Link, useSearchParams } from "react-router";

import { redirectIfAuthenticated } from "../../auth/session.server";
import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/Login";
import { LoginForm } from "./components/LoginForm";

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

export default function Login() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const registerTo = redirectTo
    ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/register";

  return (
    <Stack component="section" gap="md" py={{ base: "md", sm: "xl" }} maw={420} mx="auto">
      <Title order={1}>{t("login.title")}</Title>

      {searchParams.has("registered") && <Alert color="green">{t("login.registered")}</Alert>}

      <LoginForm />

      <Text c="dimmed">
        {t("login.noAccount")}{" "}
        <Anchor component={Link} to={registerTo}>
          {t("nav.register")}
        </Anchor>
      </Text>
    </Stack>
  );
}
