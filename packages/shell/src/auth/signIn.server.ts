import { login } from "../api/endpoints/auth.server";
import type { LoginRequest } from "@vendor-hub/types";
import { commitToken } from "./sessionCookie.server";

export async function signIn(credentials: LoginRequest): Promise<string> {
  const token = await login(credentials);

  return commitToken(token.accessToken, token.expiresIn);
}
