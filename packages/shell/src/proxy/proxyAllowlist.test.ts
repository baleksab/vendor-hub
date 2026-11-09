import { describe, expect, it } from "vitest";

import { isProxied } from "./proxyAllowlist";

const ID = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const OTHER_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("isProxied", () => {
  it.each([
    ["GET", "/api/v1/countries"],
    ["GET", "/api/v1/users"],
    ["GET", "/api/v1/users/abc-123"],
    ["PATCH", "/api/v1/users/abc-123"],
    ["GET", "/api/v1/vendors/managed"],
    ["GET", "/api/v1/insights/vendors"],
    ["GET", `/api/v1/insights/vendors/${ID}`],
    ["GET", `/api/v1/insights/products/${ID}`],
    ["GET", `/api/v1/vendors/${ID}`],
    ["PATCH", `/api/v1/vendors/${ID}`],
    ["DELETE", `/api/v1/vendors/${ID}`],
    ["POST", `/api/v1/vendors/${ID}/operators`],
    ["DELETE", `/api/v1/vendors/${ID}/operators/${OTHER_ID}`],
    ["POST", `/api/v1/vendors/${ID}/products`],
    ["PATCH", `/api/v1/products/${ID}`],
    ["DELETE", `/api/v1/products/${ID}`],
    ["POST", `/api/v1/products/${ID}/images`],
    ["PUT", `/api/v1/products/${ID}/images/order`],
    ["DELETE", `/api/v1/products/${ID}/images/${OTHER_ID}`],
    ["DELETE", `/api/v1/products/${ID}/reviews/${OTHER_ID}`],
    ["GET", "/api/v1/categories"],
    ["GET", `/api/v1/products/${ID}`],
    ["GET", `/api/v1/products/${ID}/reviews`],
    ["GET", "/api/v1/vendors/by-slug/acme/products"],
    ["GET", `/api/v1/product-images/${ID}`],
    ["GET", `/api/v1/vendors/${ID}/orders`],
    ["GET", `/api/v1/orders/${ID}`],
    ["POST", `/api/v1/orders/${ID}/deliver`],
    ["POST", `/api/v1/orders/${ID}/returns/approve`],
    ["POST", `/api/v1/orders/${ID}/returns/reject`],
  ])("allows %s %s", (method, path) => {
    expect(isProxied(method, path)).toBe(true);
  });

  it.each([
    ["PUT", `/api/v1/products/${ID}/reviews/me`],
    ["POST", `/api/v1/products/${ID}`],
    ["GET", "/api/v1/product-images/nope"],
    ["DELETE", `/api/v1/product-images/${ID}`],
    ["GET", "/api/v1/orders"],
    ["POST", "/api/v1/orders"],
    ["POST", `/api/v1/orders/${ID}/payments`],
    ["POST", `/api/v1/orders/${ID}/cancel`],
    ["POST", `/api/v1/orders/${ID}/confirm-receipt`],
    ["POST", `/api/v1/orders/${ID}/return-requests`],
    ["POST", `/api/v1/orders/${ID}/returns/delete`],
    ["POST", "/api/v1/cart/quote"],
  ])("rejects %s %s", (method, path) => {
    expect(isProxied(method, path)).toBe(false);
  });

  it.each([
    ["GET", "/api/v1/vendors"],
    ["GET", "/api/v1/vendors/me"],
    ["POST", "/api/v1/vendors"],
    ["POST", "/api/v1/vendors/me/operators"],
    ["DELETE", "/api/v1/vendors/me/operators/" + OTHER_ID],
    ["DELETE", "/api/v1/vendors/managed"],
    ["POST", "/api/v1/insights/vendors"],
    ["GET", "/api/v1/insights/vendors/not-a-uuid"],
    ["GET", "/api/v1/insights/unknown"],
    ["PATCH", "/api/v1/vendors/managed"],
    ["GET", `/api/v1/vendors/${ID}/operators`],
    ["PATCH", `/api/v1/vendors/${ID}/operators/${OTHER_ID}`],
    ["GET", "/api/v1/vendors/not-a-uuid"],
    ["DELETE", "/api/v1/users/abc-123"],
    ["POST", "/api/v1/users"],
    ["PUT", `/api/v1/vendors/${ID}`],
  ])("rejects %s %s", (method, path) => {
    expect(isProxied(method, path)).toBe(false);
  });
});
