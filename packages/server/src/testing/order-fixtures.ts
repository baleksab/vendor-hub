import type { FastifyInstance } from "fastify";

import { validUser } from "./build-test-app.ts";

export type Headers = Record<string, string>;

export const shipping = {
  firstName: "Bora",
  lastName: "Buyer",
  email: "bora@example.com",
  phoneNumber: "+381601112223",
  address: "Knez Mihailova 1",
  country: "RS",
};

export function userData(email: string, firstName = "Test") {
  return { ...validUser, email, firstName };
}

export async function bearerFor(
  app: FastifyInstance,
  user: Record<string, unknown>,
): Promise<Headers> {
  await app.inject({ method: "POST", url: "/api/v1/users", payload: user });

  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth",
    payload: { email: user.email, password: user.password },
  });

  return { authorization: `Bearer ${login.json().accessToken}` };
}

export async function createVendor(
  app: FastifyInstance,
  owner: Headers,
  slug: string,
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/vendors",
    headers: owner,
    payload: { slug, name: `Vendor ${slug}`, description: "A test vendor." },
  });

  return response.json().id;
}

export async function createProduct(
  app: FastifyInstance,
  owner: Headers,
  vendorId: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/vendors/${vendorId}/products`,
    headers: owner,
    payload: {
      name: "Lamp",
      description: "A desk lamp",
      category: "tv-audio",
      priceMinor: 1500,
      currency: "EUR",
      stock: 5,
      ...overrides,
    },
  });

  return response.json().id;
}

export function placeOrder(
  app: FastifyInstance,
  buyer: Headers,
  lines: { productId: string; quantity: number }[],
  idempotencyKey: string = crypto.randomUUID(),
) {
  return app.inject({
    method: "POST",
    url: "/api/v1/orders",
    headers: buyer,
    payload: { lines, shipping, idempotencyKey },
  });
}

export function post(app: FastifyInstance, headers: Headers, url: string, payload?: object) {
  return app.inject({
    method: "POST",
    url,
    headers,
    ...(payload === undefined ? {} : { payload }),
  });
}
