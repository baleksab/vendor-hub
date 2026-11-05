import { Stack, Title } from "@mantine/core";
import { redirect } from "react-router";

import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import { VENDORS_PATH } from "../../vendor/vendorPaths";
import { loadVendorPage, readPage } from "../../vendor/vendorList.server";
import type { Route } from "./+types/Vendors";
import { VendorList } from "./components/VendorList";

async function loadVendors(page: number) {
  try {
    const vendors = await loadVendorPage(page);

    if (page > vendors.pageCount) {
      throw redirect(
        vendors.pageCount === 1 ? VENDORS_PATH : `${VENDORS_PATH}?page=${vendors.pageCount}`,
      );
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
  return { vendors: await loadVendors(readPage(request)) };
}

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.vendors.title",
    descriptionKey: "seo.vendors.description",
    path: VENDORS_PATH,
  });
}

export default function Vendors({ loaderData }: Route.ComponentProps) {
  const t = useT();

  return (
    <Stack gap="lg" py={{ base: "lg", sm: "xl" }}>
      <Title order={1}>{t("vendors.title")}</Title>
      <VendorList vendors={loaderData.vendors} />
    </Stack>
  );
}
