import type { components, paths } from "./generated/schema.gen.ts";

export type * from "./generated/schema.gen.ts";

type Schemas = components["schemas"];

export type LoginRequest = Schemas["LoginRequest"];
export type TokenResponse = Schemas["TokenResponse"];
export type CreateUserRequest = Schemas["CreateUserRequest"];
export type UserResponse = Schemas["UserResponse"];
export type CountryListResponse = Schemas["CountryListResponse"];
export type RegisterVendorRequest = Schemas["RegisterVendorRequest"];
export type AddOperatorRequest = Schemas["AddOperatorRequest"];
export type VendorResponse = Schemas["VendorResponse"];
export type MyVendorsResponse = Schemas["MyVendorsResponse"];
export type PublicVendorResponse = Schemas["PublicVendorResponse"];
export type VendorListResponse = Schemas["VendorListResponse"];
export type VendorListItemResponse = Schemas["VendorListItemResponse"];

export type UpdateUserRequest = Schemas["UpdateUserRequest"];
export type UserListResponse = Schemas["UserListResponse"];
export type UserListQuery = NonNullable<paths["/api/v1/users"]["get"]["parameters"]["query"]>;

export type Locale = "en" | "sr";

export type UserAdministratorProps = {
  locale: Locale;
  apiBaseUrl: string;
  onUnauthorized: () => void;
};
