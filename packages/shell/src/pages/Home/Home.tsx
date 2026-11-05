import { Button, Stack, Text, Title } from "@mantine/core";
import { data, Link } from "react-router";

import { ApiError } from "../../api/ApiError";
import { getVendorBySlug } from "../../api/endpoints/vendors.server";
import { getEnv } from "../../env.server";

import { useT } from "../../i18n/LocaleProvider";
import { createPageMeta } from "../../seo/createMeta";
import { pageMeta, readRootData } from "../../seo/pageMeta";
import { readVendorSlug } from "../../vendor/vendorSite";
import type { Route } from "./+types/Home";
import { VendorSite } from "./components/VendorSite";

const DESCRIPTION_MAX = 160;

export async function loader({ request }: Route.LoaderArgs) {
  const slug = readVendorSlug(request, getEnv().vendorSlugHeader);

  if (slug === null) {
    return { vendorSite: null };
  }

  try {
    return { vendorSite: await getVendorBySlug(slug) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw data(null, { status: 404 });
    }

    throw error;
  }
}

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const vendor = loaderData?.vendorSite;
  const root = readRootData(matches);

  if (vendor && root) {
    const description = vendor.description.slice(0, DESCRIPTION_MAX);

    return createPageMeta({
      title: vendor.name,
      description,
      path: "/",
      origin: root.origin,
      locale: root.locale,
      siteName: vendor.name,
    });
  }

  return pageMeta(matches, {
    titleKey: "seo.home.title",
    descriptionKey: "seo.home.description",
    path: "/",
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const t = useT();

  if (loaderData.vendorSite) {
    return <VendorSite vendor={loaderData.vendorSite} />;
  }

  return (
    <Stack component="section" gap="md" py={{ base: "lg", sm: "xl" }} maw={640}>
      <Title order={1} fz={{ base: 32, sm: 44 }}>
        {t("home.title")}
      </Title>
      <Text c="dimmed" fz={{ base: "md", sm: "lg" }}>
        {t("home.subtitle")}
      </Text>
      <Button
        component={Link}
        to="/remote-test"
        size="md"
        mih={44}
        w={{ base: "100%", sm: "auto" }}
        style={{ alignSelf: "flex-start" }}
      >
        {t("home.cta")}
      </Button>
    </Stack>
  );
}
