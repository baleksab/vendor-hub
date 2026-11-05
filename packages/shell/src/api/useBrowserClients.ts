import { useMemo } from "react";
import { useRouteLoaderData } from "react-router";

import type { loader } from "../root";
import { createBrowserClients, type BrowserClients } from "./apiClient";

export function useBrowserClients(): BrowserClients {
  const origin = useRouteLoaderData<typeof loader>("root")?.origin;

  if (origin === undefined) {
    throw new Error("useBrowserClients needs the root loader data");
  }

  return useMemo(() => createBrowserClients(origin), [origin]);
}
