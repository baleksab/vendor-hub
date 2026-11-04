import { Alert, Skeleton, Text, Title } from "@mantine/core";
import {
  Component,
  Suspense,
  use,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";
import { useRouteLoaderData } from "react-router";

import { getFederation } from "../remote";
import { useT } from "../i18n/LocaleProvider";
import type { loader as rootLoader } from "../root";

class RemoteErrorBoundary extends Component<
  { children: ReactNode; title: string; message: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <Alert color="red" title={this.props.title}>
          {this.props.message}
        </Alert>
      );
    }

    return this.props.children;
  }
}

function RemoteFallback() {
  return <Skeleton height={96} />;
}

type WidgetModule = { default: ComponentType };

const modules = new Map<string, Promise<WidgetModule>>();

function loadWidget(manifestUrl: string): Promise<WidgetModule> {
  let promise = modules.get(manifestUrl);

  if (!promise) {
    promise = getFederation(manifestUrl)
      .loadRemote<WidgetModule>("remote-test/Widget")
      .then((module) => {
        if (!module) {
          throw new Error("remote-test/Widget not found");
        }

        return module;
      });
    modules.set(manifestUrl, promise);
  }

  return promise;
}

function RemoteWidget({ manifestUrl }: { manifestUrl: string }) {
  const { default: Widget } = use(loadWidget(manifestUrl));

  return <Widget />;
}

function RemoteSlot({ manifestUrl }: { manifestUrl: string }) {
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

const subscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
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
