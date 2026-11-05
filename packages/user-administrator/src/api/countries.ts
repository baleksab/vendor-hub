import { unwrap } from "@vendor-hub/api-client";

import type { ApiClient } from "./client";

export async function listCountries(client: ApiClient): Promise<string[]> {
  const { data } = await unwrap(client.GET("/api/v1/countries"));

  return data;
}
