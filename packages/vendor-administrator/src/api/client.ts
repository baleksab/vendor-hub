import { createApiClient } from "@vendor-hub/api-client";
import type { paths } from "@vendor-hub/types";

export type ApiClient = ReturnType<typeof createApiClient<paths>>;

export function createVendorsClient(baseUrl: string): ApiClient {
  return createApiClient<paths>({ baseUrl });
}
