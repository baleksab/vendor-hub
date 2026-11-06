import { redirect } from "react-router";

import { assertSameOrigin } from "../auth/sameOrigin.server";
import { clearToken } from "../auth/sessionCookie.server";
import { clearCart } from "../cart/cartSession.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);

  const headers = new Headers();

  headers.append("Set-Cookie", await clearToken());
  headers.append("Set-Cookie", await clearCart());

  return redirect("/", { headers });
}
