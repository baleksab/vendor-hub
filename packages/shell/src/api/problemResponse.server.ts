import type { ApiError } from "./ApiError";
import type { Problem } from "./problem";

const PROBLEM_CONTENT_TYPE = "application/problem+json";
const BAD_GATEWAY = 502;

export function problemResponse(error: ApiError, headers?: HeadersInit): Response {
  const status = error.status === 0 ? BAD_GATEWAY : error.status;
  const errors = Object.entries(error.fieldErrors).map(([path, message]) => ({ path, message }));
  const problem: Problem = {
    title: error.title,
    status,
    detail: error.detail,
    ...(errors.length > 0 ? { errors } : {}),
  };
  const responseHeaders = new Headers(headers);

  responseHeaders.set("Content-Type", PROBLEM_CONTENT_TYPE);

  return new Response(JSON.stringify(problem), { status, headers: responseHeaders });
}
