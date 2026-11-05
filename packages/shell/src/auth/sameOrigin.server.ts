import { getEnv } from "../env.server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const FORBIDDEN = 403;

export function assertSameOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method)) {
    return;
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  const origin = request.headers.get("Origin");

  if (!contentType.toLowerCase().startsWith("application/json") || origin !== getEnv().origin) {
    throw new Response("Forbidden", { status: FORBIDDEN });
  }
}
