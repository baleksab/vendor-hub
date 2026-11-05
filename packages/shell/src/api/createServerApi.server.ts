import type { AxiosInstance } from "axios";

import { getEnv } from "../env.server";
import { createClient } from "./createClient";

export const API_PREFIX = "/api/v1";

export function createServerApi(token?: string): AxiosInstance {
  return createClient({
    baseURL: `${getEnv().apiUrl}${API_PREFIX}`,
    headers: token === undefined ? undefined : { Authorization: `Bearer ${token}` },
  });
}
