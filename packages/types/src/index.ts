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

export type CartLineRequest = Schemas["CartLineRequestInput"];
export type CartQuoteResponse = Schemas["CartQuoteResponse"];
export type CartQuoteLineResponse = Schemas["CartQuoteLineResponse"];
export type CurrencyTotalResponse = Schemas["CurrencyTotalResponse"];
export type ShippingDetails = Schemas["ShippingDetailsInput"];
export type CreateOrdersRequest = Schemas["CreateOrdersRequestInput"];
export type CreateOrdersResponse = Schemas["CreateOrdersResponse"];
export type OrderSummaryResponse = Schemas["OrderSummaryResponse"];
export type OrderListResponse = Schemas["OrderListResponse"];
export type OrderResponse = Schemas["OrderResponse"];
export type OrderItemResponse = Schemas["OrderItemResponse"];
export type OrderEventResponse = Schemas["OrderEventResponse"];
export type PaymentResponse = Schemas["PaymentResponse"];
export type PaymentOutcomeResponse = Schemas["PaymentOutcomeResponse"];
export type OrderStatus = OrderResponse["status"];
export type OrderAction = OrderResponse["allowedActions"][number];
export type OrderListQuery = NonNullable<paths["/api/v1/orders"]["get"]["parameters"]["query"]>;

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

export type InsightsProps = {
  locale: Locale;
  apiBaseUrl: string;
  onUnauthorized: () => void;
};

export type InsightsVendorListResponse = Schemas["InsightsVendorListResponse"];
export type InsightsVendorRow = Schemas["InsightsVendorRow"];
export type VendorInsightsResponse = Schemas["VendorInsightsResponse"];
export type ProductInsightsResponse = Schemas["ProductInsightsResponse"];
export type InsightsVendorListQuery = NonNullable<
  paths["/api/v1/insights/vendors"]["get"]["parameters"]["query"]
>;
export type InsightsDetailQuery = NonNullable<
  paths["/api/v1/insights/vendors/{id}"]["get"]["parameters"]["query"]
>;
