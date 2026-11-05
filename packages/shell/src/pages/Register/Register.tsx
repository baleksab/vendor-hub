import { Alert, Anchor, Button, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useMemo } from "react";
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
import { FormAlert } from "../../components/FormAlert/FormAlert";
import { FormField } from "../../components/FormField/FormField";
import { useLocale, useT } from "../../i18n/LocaleProvider";
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

  try {
    return { countries: await loadCountries() };
  } catch {
    return { countries: null };
  }
}

export function action({ request }: Route.ActionArgs) {
  return registerAction(request);
}

export default function Register({ actionData }: Route.ComponentProps) {
  const t = useT();
  const locale = useLocale();
  const { countries } = useLoaderData<typeof loader>();
  const { revalidate, state: revalidation } = useRevalidator();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const loginTo = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";
  const values = actionData?.values;
  const fields = actionData?.fields;

  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });

    return (countries ?? [])
      .map((code) => ({ value: code, label: names.of(code) ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [countries, locale]);

  return (
    <Stack component="section" gap="md" py={{ base: "md", sm: "xl" }} maw={560} mx="auto">
      <Title order={1}>{t("register.title")}</Title>

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
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <FormField
                name="firstName"
                label={t("auth.firstName")}
                autoComplete="given-name"
                defaultValue={values?.firstName}
                error={fields?.firstName}
              />
              <FormField
                name="lastName"
                label={t("auth.lastName")}
                autoComplete="family-name"
                defaultValue={values?.lastName}
                error={fields?.lastName}
              />
            </SimpleGrid>

            <FormField
              name="email"
              label={t("auth.email")}
              type="email"
              autoComplete="email"
              defaultValue={values?.email}
              error={fields?.email}
            />
            <FormField
              name="phoneNumber"
              label={t("auth.phoneNumber")}
              description={t("auth.phoneHint")}
              type="tel"
              autoComplete="tel"
              defaultValue={values?.phoneNumber}
              error={fields?.phoneNumber}
            />
            <FormField
              name="address"
              label={t("auth.address")}
              autoComplete="street-address"
              defaultValue={values?.address}
              error={fields?.address}
            />
            <FormField
              name="country"
              label={t("auth.country")}
              kind="select"
              options={options}
              placeholder={t("auth.countryPlaceholder")}
              autoComplete="country"
              defaultValue={values?.country}
              error={fields?.country}
            />
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
