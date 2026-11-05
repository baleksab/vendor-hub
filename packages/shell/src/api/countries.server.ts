import { unwrap } from "./createApiClient";
import { createServerApi } from "./createServerApi.server";

export async function loadCountries(): Promise<string[]> {
  const { data } = await unwrap(createServerApi().GET("/api/v1/countries"));

  return data;
}
