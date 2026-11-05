import { Button, Stack, Text, Title } from "@mantine/core";
import { data, Link, redirect } from "react-router";

import { ApiError } from "../../api/ApiError";
import { getVendorBySlug } from "../../api/endpoints/vendors.server";
import { getEnv } from "../../env.server";

import { useT } from "../../i18n/LocaleProvider";
import { createPageMeta } from "../../seo/createMeta";
import { pageMeta, readRootData } from "../../seo/pageMeta";
import { loadVendorPage, readPage } from "../../vendor/vendorList.server";
import { readVendorSlug } from "../../vendor/vendorSite";
import type { Route } from "./+types/Home";
import { VendorList } from "./components/VendorList";
import { VendorSite } from "./components/VendorSite";

const DESCRIPTION_MAX = 160;

async function loadVendors(page: number) {
  try {
    const vendors = await loadVendorPage(page);

    if (page > vendors.pageCount) {
      throw redirect(vendors.pageCount === 1 ? "/" : `/?page=${vendors.pageCount}`);
    }

    return vendors;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    return null;
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const slug = readVendorSlug(request, getEnv().vendorSlugHeader);

  if (slug === null) {
    return { vendorSite: null, vendors: await loadVendors(readPage(request)) };
  }

  try {
    return { vendorSite: await getVendorBySlug(slug), vendors: null };
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
    <Stack gap="xl" py={{ base: "lg", sm: "xl" }}>
      <Stack component="section" gap="md" maw={640}>
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

      <VendorList vendors={loaderData.vendors} />
    </Stack>
  );
}
