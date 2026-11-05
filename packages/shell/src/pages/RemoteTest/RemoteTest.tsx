import { Text, Title } from "@mantine/core";
import { useRouteLoaderData } from "react-router";

import { useIsClient } from "../../hooks/useIsClient/useIsClient";
import { useT } from "../../i18n/LocaleProvider";
import type { loader as rootLoader } from "../../root";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/RemoteTest";
import { RemoteFallback } from "./components/RemoteFallback";
import { RemoteSlot } from "./components/RemoteSlot";

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.remoteTest.title",
    descriptionKey: "seo.remoteTest.description",
    path: "/remote-test",
  });
}

export default function RemoteTest() {
  const t = useT();
  const data = useRouteLoaderData<typeof rootLoader>("root");
  const isClient = useIsClient();

  return (
    <section>
      <Title order={1} mb="md">
        {t("remoteTest.title")}
      </Title>
      <Text size="sm" c="dimmed" mb="xs">
        {t("remoteTest.hint")}
      </Text>

      {isClient && data ? (
        <RemoteSlot manifestUrl={data.remoteTestManifestUrl} />
      ) : (
        <RemoteFallback />
      )}
    </section>
  );
}
