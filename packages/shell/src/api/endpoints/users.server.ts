import { unwrap } from "../createApiClient";
import { createServerApi } from "../createServerApi.server";
import type { CreateUserRequest, UserResponse } from "@vendor-hub/types";

export async function createUser(body: CreateUserRequest): Promise<void> {
  await unwrap(createServerApi().POST("/api/v1/users", { body }));
}

export function getCurrentUser(token: string): Promise<UserResponse> {
  return unwrap(createServerApi(token).GET("/api/v1/users/me"));
}
