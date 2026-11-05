import { Suspense, use } from "react";

import { useT } from "../../../i18n/LocaleProvider";
import { loadWidget } from "../loadWidget";
import { RemoteErrorBoundary } from "./RemoteErrorBoundary";
import { RemoteFallback } from "./RemoteFallback";

function RemoteWidget({ manifestUrl }: { manifestUrl: string }) {
  const { default: Widget } = use(loadWidget(manifestUrl));

  return <Widget />;
}

export function RemoteSlot({ manifestUrl }: { manifestUrl: string }) {
  const t = useT();

  return (
    <RemoteErrorBoundary
      title={t("remoteTest.error.title")}
      message={t("remoteTest.error.message")}
    >
      <Suspense fallback={<RemoteFallback />}>
        <RemoteWidget manifestUrl={manifestUrl} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
