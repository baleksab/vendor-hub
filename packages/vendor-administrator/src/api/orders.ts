import { unwrap } from "@vendor-hub/api-client";
import type { OrderListResponse, OrderResponse } from "@vendor-hub/types";

import type { ApiClient } from "./client";
import type { OrderListParams } from "./queryKeys";

export function listVendorOrders(
  client: ApiClient,
  vendorId: string,
  params: OrderListParams,
): Promise<OrderListResponse> {
  return unwrap(
    client.GET("/api/v1/vendors/{id}/orders", {
      params: { path: { id: vendorId }, query: params },
    }),
  );
}

export function getOrder(client: ApiClient, id: string): Promise<OrderResponse> {
  return unwrap(client.GET("/api/v1/orders/{id}", { params: { path: { id } } }));
}

export function deliverOrder(client: ApiClient, id: string): Promise<OrderResponse> {
  return unwrap(client.POST("/api/v1/orders/{id}/deliver", { params: { path: { id } } }));
}

export function approveReturn(client: ApiClient, id: string): Promise<OrderResponse> {
  return unwrap(client.POST("/api/v1/orders/{id}/returns/approve", { params: { path: { id } } }));
}

export function rejectReturn(
  client: ApiClient,
  id: string,
  reason: string,
): Promise<OrderResponse> {
  return unwrap(
    client.POST("/api/v1/orders/{id}/returns/reject", {
      params: { path: { id } },
      body: { reason },
    }),
  );
}
