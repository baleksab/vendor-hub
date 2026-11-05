import { getEnv } from "../env.server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const FORBIDDEN = 403;

export function assertSameOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method)) {
    return;
  }

  if (request.headers.get("Origin") !== getEnv().origin) {
    throw new Response("Forbidden", { status: FORBIDDEN });
  }
}
