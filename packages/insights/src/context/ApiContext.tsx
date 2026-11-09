import { createContext, use } from "react";

import type { ApiClient } from "../api/client";

export const ApiContext = createContext<ApiClient | null>(null);

export function useApiClient(): ApiClient {
  const client = use(ApiContext);

  if (!client) {
    throw new Error("useApiClient must be used inside Insights");
  }

  return client;
}
