import { Text, Title } from "@mantine/core";
import { use, type ComponentType } from "react";
import { useRouteLoaderData } from "react-router";

import { RemoteFallback } from "../../components/RemoteFallback/RemoteFallback";
import { RemoteSlot } from "../../components/RemoteSlot/RemoteSlot";
import { useIsClient } from "../../hooks/useIsClient/useIsClient";
import { useT } from "../../i18n/LocaleProvider";
import { loadRemoteModule, type RemoteManifestUrls } from "../../remote";
import type { loader as rootLoader } from "../../root";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/RemoteTest";

type WidgetModule = { default: ComponentType };

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.remoteTest.title",
    descriptionKey: "seo.remoteTest.description",
    path: "/remote-test",
  });
}

function RemoteWidget({ manifestUrls }: { manifestUrls: RemoteManifestUrls }) {
  const { default: Widget } = use(
    loadRemoteModule<WidgetModule>(manifestUrls, "remote-test/Widget"),
  );

  return <Widget />;
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
        <RemoteSlot
          errorTitle={t("remoteTest.error.title")}
          errorMessage={t("remoteTest.error.message")}
        >
          <RemoteWidget manifestUrls={data.remoteManifestUrls} />
        </RemoteSlot>
      ) : (
        <RemoteFallback />
      )}
    </section>
  );
}
