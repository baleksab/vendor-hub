import { Anchor, List, Stack, Text, Title } from "@mantine/core";
import { redirect } from "react-router";

import { requireUser } from "../../auth/session.server";
import { getEnv } from "../../env.server";
import { useT } from "../../i18n/LocaleProvider";
import { pageMeta } from "../../seo/pageMeta";
import { loadMyVendors } from "../../vendor/myVendors.server";
import { vendorSiteOrigin } from "../../vendor/vendorSite";
import type { Route } from "./+types/Vendor";
import { OwnedVendor } from "./components/OwnedVendor";
import { vendorAction } from "./vendorAction.server";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.vendor.title",
    descriptionKey: "seo.vendor.description",
    path: "/vendor",
    noindex: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireUser(request);
  const { owned, operating } = await loadMyVendors(request, session);

  if (owned === null && operating.length === 0) {
    throw redirect("/become-vendor");
  }

  const template = getEnv().vendorSiteOrigin;

  return {
    ownerId: session.user.id,
    owned: owned && { vendor: owned, siteUrl: vendorSiteOrigin(template, owned.slug) },
    operating: operating.map((vendor) => ({
      ...vendor,
      siteUrl: vendorSiteOrigin(template, vendor.slug),
    })),
  };
}

export function action({ request }: Route.ActionArgs) {
  return vendorAction(request);
}

export default function Vendor({ loaderData, actionData }: Route.ComponentProps) {
  const t = useT();
  const { owned, operating, ownerId } = loaderData;

  return (
    <Stack component="section" gap="xl" py={{ base: "md", sm: "xl" }} maw={720}>
      {owned && (
        <OwnedVendor
          vendor={owned.vendor}
          siteUrl={owned.siteUrl}
          ownerId={ownerId}
          actionData={actionData}
        />
      )}

      {operating.length > 0 && (
        <Stack gap="xs" component="section" aria-labelledby="operating-title">
          <Title order={owned ? 2 : 1} id="operating-title" fz={owned ? "lg" : undefined}>
            {t("vendorPage.operating")}
          </Title>
          <List listStyleType="none" spacing="xs">
            {operating.map((vendor) => (
              <List.Item key={vendor.slug}>
                <Anchor href={vendor.siteUrl} mih={44} style={{ display: "inline-flex" }}>
                  {vendor.name}
                </Anchor>{" "}
                <Text span c="dimmed">
                  ({t("vendor.role.operator")})
                </Text>
              </List.Item>
            ))}
          </List>
        </Stack>
      )}
    </Stack>
  );
}
