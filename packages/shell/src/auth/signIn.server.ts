import { login } from "../api/endpoints/auth.server";
import { getCurrentUser } from "../api/endpoints/users.server";
import type { LoginRequest } from "@vendor-hub/types";
import { claimCart } from "../cart/cartSession.server";
import { commitToken } from "./sessionCookie.server";

export async function signIn(request: Request, credentials: LoginRequest): Promise<Headers> {
  const token = await login(credentials);
  const user = await getCurrentUser(token.accessToken);
  const headers = new Headers();

  headers.append("Set-Cookie", await commitToken(token.accessToken, token.expiresIn));
  headers.append("Set-Cookie", await claimCart(request, user.id));

  return headers;
}
