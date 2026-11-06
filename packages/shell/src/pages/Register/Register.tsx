import { Alert, Anchor, Button, Stack, Text, Title } from "@mantine/core";
import {
  Form,
  Link,
  useLoaderData,
  useNavigation,
  useRevalidator,
  useSearchParams,
} from "react-router";

import { loadCountries } from "../../api/endpoints/countries.server";
import { redirectIfAuthenticated } from "../../auth/session.server";
import { getCartSession, readCheckout } from "../../cart/cartSession.server";
import { ContactFields } from "../../components/ContactFields/ContactFields";
import { FormAlert } from "../../components/FormAlert/FormAlert";
import { FormField } from "../../components/FormField/FormField";
import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/Register";
import { registerAction } from "./registerAction.server";

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

  const checkout = readCheckout(await getCartSession(request));

  try {
    return { countries: await loadCountries(), checkout };
  } catch {
    return { countries: null, checkout };
  }
}

export function action({ request }: Route.ActionArgs) {
  return registerAction(request);
}

export default function Register({ actionData }: Route.ComponentProps) {
  const t = useT();
  const { countries, checkout } = useLoaderData<typeof loader>();
  const { revalidate, state: revalidation } = useRevalidator();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const loginTo = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";
  const values = actionData?.values ?? checkout ?? undefined;
  const fields = actionData?.fields;

  return (
    <Stack component="section" gap="md" maw={560} mx="auto">
      <Title order={1}>{t("register.title")}</Title>

      {checkout === null ? null : (
        <Alert color="blue">
          <Stack gap="xs">
            <Text size="sm">{t("register.checkoutNote")}</Text>
            <Anchor component={Link} to={loginTo} size="sm" fw={600}>
              {t("register.loginInstead")}
            </Anchor>
          </Stack>
        </Alert>
      )}

      {countries === null ? (
        <Alert color="red" role="alert" title={t("auth.countryError")}>
          <Button
            variant="default"
            mih={44}
            loading={revalidation === "loading"}
            onClick={() => void revalidate()}
          >
            {t("auth.countryRetry")}
          </Button>
        </Alert>
      ) : (
        <Form method="post" noValidate>
          <Stack gap="md">
            <ContactFields countries={countries} values={values} errors={fields} />
            <FormField
              name="password"
              label={t("auth.password")}
              kind="password"
              autoComplete="new-password"
              error={fields?.password}
            />
            <FormField
              name="confirmPassword"
              label={t("auth.confirmPassword")}
              kind="password"
              autoComplete="new-password"
              error={fields?.confirmPassword}
            />

            <FormAlert message={actionData?.form} />

            <Button type="submit" size="md" mih={44} loading={navigation.state === "submitting"}>
              {t("register.submit")}
            </Button>
          </Stack>
        </Form>
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
