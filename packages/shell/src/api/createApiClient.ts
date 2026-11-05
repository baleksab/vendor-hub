import createClient, { type ClientOptions } from "openapi-fetch";

import type { paths } from "@vendor-hub/types";
import { fromResponse, networkError } from "./ApiError";

const REQUEST_TIMEOUT_MS = 10_000;

type ResultLike<Data> = Promise<{ data?: Data; error?: unknown; response: Response }>;

function fetchWithTimeout(request: Request): Promise<Response> {
  return fetch(request, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

export function createApiClient<Paths extends object = paths>(options: ClientOptions) {
  return createClient<Paths>({ fetch: fetchWithTimeout, ...options });
}

export async function unwrap<Data>(result: ResultLike<Data>): Promise<Data> {
  let settled: Awaited<ResultLike<Data>>;

  try {
    settled = await result;
  } catch (cause) {
    throw networkError(cause);
  }

  const { data, error, response } = settled;

  if (!response.ok) {
    throw fromResponse(response.status, response.statusText, error);
  }

  return data as Data;
}
