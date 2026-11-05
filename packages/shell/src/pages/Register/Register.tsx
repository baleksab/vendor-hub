import { Alert, Anchor, Button, Stack, Text, Title } from "@mantine/core";
import { Link, useLoaderData, useRevalidator, useSearchParams } from "react-router";

import { createServerApi } from "../../api/createServerApi.server";
import type { CountryListResponse } from "../../api/types";
import { redirectIfAuthenticated } from "../../auth/session.server";
import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/Register";
import { RegisterForm } from "./components/RegisterForm";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.register.title",
    descriptionKey: "seo.register.description",
    path: "/register",
    noindex: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfAuthenticated(request);

  try {
    const { data } = await createServerApi().get<CountryListResponse>("/countries");

    return { countries: data.data };
  } catch {
    return { countries: null };
  }
}

export default function Register() {
  const t = useT();
  const { countries } = useLoaderData<typeof loader>();
  const { revalidate, state } = useRevalidator();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const loginTo = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";

  return (
    <Stack component="section" gap="md" py={{ base: "md", sm: "xl" }} maw={560} mx="auto">
      <Title order={1}>{t("register.title")}</Title>

      {countries !== null ? (
        <RegisterForm countries={countries} />
      ) : (
        <Alert color="red" role="alert" title={t("auth.countryError")}>
          <Button
            variant="default"
            mih={44}
            loading={state === "loading"}
            onClick={() => void revalidate()}
          >
            {t("auth.countryRetry")}
          </Button>
        </Alert>
      )}

      <Text c="dimmed">
        {t("register.hasAccount")}{" "}
        <Anchor component={Link} to={loginTo}>
          {t("nav.login")}
        </Anchor>
      </Text>
    </Stack>
  );
}
