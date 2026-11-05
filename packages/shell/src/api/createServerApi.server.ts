import type { paths } from "@vendor-hub/types";
import { getEnv } from "../env.server";
import { createApiClient } from "@vendor-hub/api-client";

export function createServerApi(token?: string) {
  return createApiClient<paths>({
    baseUrl: getEnv().apiUrl,
    headers: token === undefined ? undefined : { Authorization: `Bearer ${token}` },
  });
}
