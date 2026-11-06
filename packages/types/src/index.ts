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

export type UpdateVendorRequest = Schemas["UpdateVendorRequest"];
export type ManagedVendorListResponse = Schemas["ManagedVendorListResponse"];
export type ManagedVendorListItemResponse = Schemas["ManagedVendorListItemResponse"];
export type ManagedVendorListQuery = NonNullable<
  paths["/api/v1/vendors/managed"]["get"]["parameters"]["query"]
>;

export type CategoryListResponse = Schemas["CategoryListResponse"];
export type CategoryResponse = Schemas["CategoryResponse"];
export type CreateProductRequest = Schemas["CreateProductRequestInput"];
export type UpdateProductRequest = Schemas["UpdateProductRequestInput"];
export type ProductResponse = Schemas["ProductResponse"];
export type ProductImageResponse = Schemas["ProductImageResponse"];
export type ProductListResponse = Schemas["ProductListResponse"];
export type ProductListItemResponse = Schemas["ProductListItemResponse"];
export type ProductCategoryCountListResponse = Schemas["ProductCategoryCountListResponse"];
export type PutReviewRequest = Schemas["PutReviewRequestInput"];
export type ReviewResponse = Schemas["ReviewResponse"];
export type ReviewListResponse = Schemas["ReviewListResponse"];

export type Locale = "en" | "sr";

export type UserAdministratorProps = {
  locale: Locale;
  apiBaseUrl: string;
  onUnauthorized: () => void;
};

export type VendorAdministratorProps = {
  locale: Locale;
  apiBaseUrl: string;
  onUnauthorized: () => void;
};
