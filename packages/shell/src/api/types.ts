import type { components } from "@vendor-hub/types";

type Schemas = components["schemas"];

export type LoginRequest = Schemas["LoginRequest"];
export type TokenResponse = Schemas["TokenResponse"];
export type CreateUserRequest = Schemas["CreateUserRequest"];
export type UserResponse = Schemas["UserResponse"];
export type CountryListResponse = Schemas["CountryListResponse"];
