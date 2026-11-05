import { Alert, Anchor, Button, Loader, Stack, Text, Title } from "@mantine/core";
import { Link, useLoaderData, useSearchParams } from "react-router";

import { createServerApi } from "../../api/createServerApi.server";
import type { CountryListResponse } from "../../api/types";
import { redirectIfAuthenticated } from "../../auth/session.server";
import { useCountries } from "../../hooks/useCountries/useCountries";
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
  const { countries: initialCountries } = useLoaderData<typeof loader>();
  const countries = useCountries(initialCountries);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const loginTo = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";

  return (
    <Stack component="section" gap="md" py={{ base: "md", sm: "xl" }} maw={560} mx="auto">
      <Title order={1}>{t("register.title")}</Title>

      {countries.data !== undefined ? (
        <RegisterForm countries={countries.data} />
      ) : countries.isError ? (
        <Alert color="red" role="alert" title={t("auth.countryError")}>
          <Button variant="default" mih={44} onClick={() => void countries.refetch()}>
            {t("auth.countryRetry")}
          </Button>
        </Alert>
      ) : (
        <Stack component="output" align="center" gap="xs">
          <Loader size="sm" />
          <Text c="dimmed">{t("auth.countryLoading")}</Text>
        </Stack>
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
