import { unwrap } from "@vendor-hub/api-client";
import { createServerApi } from "../createServerApi.server";
import type { LoginRequest, TokenResponse } from "@vendor-hub/types";

export function login(credentials: LoginRequest): Promise<TokenResponse> {
  return unwrap(createServerApi().POST("/api/v1/auth", { body: credentials }));
}
