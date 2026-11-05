import { assertSameOrigin } from "../auth/sameOrigin.server";
import { clearToken } from "../auth/sessionCookie.server";
import type { Route } from "./+types/auth.logout";

const NO_CONTENT = 204;

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);

  return new Response(null, {
    status: NO_CONTENT,
    headers: { "Set-Cookie": await clearToken() },
  });
}
