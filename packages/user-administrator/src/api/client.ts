import { createApiClient } from "@vendor-hub/api-client";
import type { paths } from "@vendor-hub/types";

export type ApiClient = ReturnType<typeof createApiClient<paths>>;

export function createUsersClient(baseUrl: string): ApiClient {
  return createApiClient<paths>({ baseUrl });
}
