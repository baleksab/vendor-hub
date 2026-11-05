import { unwrap } from "@vendor-hub/api-client";
import type { UpdateUserRequest, UserListResponse, UserResponse } from "@vendor-hub/types";

import type { ApiClient } from "./client";
import type { UserListParams } from "./queryKeys";

export function listUsers(client: ApiClient, params: UserListParams): Promise<UserListResponse> {
  return unwrap(client.GET("/api/v1/users", { params: { query: params } }));
}

export function getUser(client: ApiClient, id: string): Promise<UserResponse> {
  return unwrap(client.GET("/api/v1/users/{id}", { params: { path: { id } } }));
}

export function updateUser(
  client: ApiClient,
  id: string,
  body: UpdateUserRequest,
): Promise<UserResponse> {
  return unwrap(client.PATCH("/api/v1/users/{id}", { params: { path: { id } }, body }));
}
