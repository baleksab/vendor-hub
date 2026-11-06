import { unwrap } from "@vendor-hub/api-client";
import type {
  CreateOrdersRequest,
  CreateOrdersResponse,
  OrderListQuery,
  OrderListResponse,
  OrderResponse,
  PaymentOutcomeResponse,
} from "@vendor-hub/types";
import { createServerApi } from "../createServerApi.server";

export function createOrders(
  token: string,
  body: CreateOrdersRequest,
): Promise<CreateOrdersResponse> {
  return unwrap(createServerApi(token).POST("/api/v1/orders", { body }));
}

export function listOrders(token: string, query: OrderListQuery): Promise<OrderListResponse> {
  return unwrap(createServerApi(token).GET("/api/v1/orders", { params: { query } }));
}

export function getOrder(token: string, id: string): Promise<OrderResponse> {
  return unwrap(createServerApi(token).GET("/api/v1/orders/{id}", { params: { path: { id } } }));
}

export function payOrder(
  token: string,
  id: string,
  cardNumber: string,
): Promise<PaymentOutcomeResponse> {
  return unwrap(
    createServerApi(token).POST("/api/v1/orders/{id}/payments", {
      params: { path: { id } },
      body: { cardNumber },
    }),
  );
}

export function cancelOrder(token: string, id: string): Promise<OrderResponse> {
  return unwrap(
    createServerApi(token).POST("/api/v1/orders/{id}/cancel", { params: { path: { id } } }),
  );
}

export function confirmReceipt(token: string, id: string): Promise<OrderResponse> {
  return unwrap(
    createServerApi(token).POST("/api/v1/orders/{id}/confirm-receipt", {
      params: { path: { id } },
    }),
  );
}

export function requestReturn(token: string, id: string, reason: string): Promise<OrderResponse> {
  return unwrap(
    createServerApi(token).POST("/api/v1/orders/{id}/return-requests", {
      params: { path: { id } },
      body: { reason },
    }),
  );
}
