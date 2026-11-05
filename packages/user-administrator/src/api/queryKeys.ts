import type { UserListQuery } from "@vendor-hub/types";

export type UserListParams = Required<Pick<UserListQuery, "limit" | "offset">> &
  Omit<UserListQuery, "limit" | "offset">;

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export const countryKeys = {
  all: ["countries"] as const,
};
