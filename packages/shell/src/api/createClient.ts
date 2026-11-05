import axios, { type AxiosInstance, type CreateAxiosDefaults } from "axios";

import { toApiError } from "./ApiError";

const REQUEST_TIMEOUT_MS = 10_000;

export function createClient(config: CreateAxiosDefaults): AxiosInstance {
  const client = axios.create({ timeout: REQUEST_TIMEOUT_MS, ...config });

  client.interceptors.response.use(undefined, (error: unknown) =>
    Promise.reject(toApiError(error)),
  );

  return client;
}
