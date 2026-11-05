import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildTestApp, validUser } from "../testing/build-test-app.ts";

const acme = {
  slug: "acme",
  name: "Acme Inc",
  description: "We sell everything you need.",
};

const operatorUser = { ...validUser, email: "op@example.com", firstName: "Oscar" };

describe("vendors routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    await app?.close();
    ({ app } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  async function bearerFor(user: Record<string, unknown> = validUser) {
    await app.inject({ method: "POST", url: "/api/v1/users", payload: user });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth",
      payload: { email: user.email, password: user.password },
    });

    return { authorization: `Bearer ${login.json().accessToken}` };
  }

  const registerVendor = (headers: Record<string, string>, body: Record<string, unknown> = acme) =>
    app.inject({ method: "POST", url: "/api/v1/vendors", headers, payload: body });

  const addOperator = (headers: Record<string, string>, email: string) =>
    app.inject({
      method: "POST",
      url: "/api/v1/vendors/me/operators",
      headers,
      payload: { email },
    });

  it("registers a vendor with the caller as the owner", async () => {
    const headers = await bearerFor();
    const response = await registerVendor(headers);

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      slug: "acme",
      name: "Acme Inc",
      members: [{ firstName: "Jane", lastName: "Doe", role: "owner" }],
    });
  });

  it("returns 409 when the user already owns a vendor", async () => {
    const headers = await bearerFor();

    await registerVendor(headers);
    const second = await registerVendor(headers, { ...acme, slug: "other" });

    expect(second.statusCode).toBe(409);
  });

  it("treats slugs as case-insensitive when checking uniqueness", async () => {
    const first = await bearerFor();
    const second = await bearerFor(operatorUser);

    await registerVendor(first);
    const taken = await app.inject({
      method: "GET",
      url: "/api/v1/vendors/by-slug/ACME",
    });
    const duplicate = await registerVendor(second);

    expect(taken.statusCode).toBe(200);
    expect(duplicate.statusCode).toBe(409);
  });

  it.each(["www", "api", "ab", "Acme", "-acme", "acme-", "ac--me", "ac me"])(
    "rejects the slug %s with 400",
    async (slug) => {
      const response = await registerVendor(await bearerFor(), { ...acme, slug });

      expect(response.statusCode).toBe(400);
      expect(response.json().errors).toEqual([expect.objectContaining({ path: "slug" })]);
    },
  );

  it("requires a token for every protected vendor route", async () => {
    const calls = [
      app.inject({ method: "POST", url: "/api/v1/vendors", payload: acme }),
      app.inject({ method: "GET", url: "/api/v1/vendors/me" }),
      app.inject({
        method: "POST",
        url: "/api/v1/vendors/me/operators",
        payload: { email: "a@b.co" },
      }),
      app.inject({
        method: "DELETE",
        url: "/api/v1/vendors/me/operators/0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
      }),
    ];

    for (const response of await Promise.all(calls)) {
      expect(response.statusCode).toBe(401);
    }
  });

  it("returns the owned and operated vendors on /vendors/me", async () => {
    const owner = await bearerFor();
    const operator = await bearerFor(operatorUser);

    await registerVendor(owner);
    await addOperator(owner, operatorUser.email);

    const ownerView = await app.inject({
      method: "GET",
      url: "/api/v1/vendors/me",
      headers: owner,
    });
    const operatorView = await app.inject({
      method: "GET",
      url: "/api/v1/vendors/me",
      headers: operator,
    });

    expect(ownerView.json().owned.slug).toBe("acme");
    expect(ownerView.json().operating).toEqual([]);
    expect(operatorView.json().owned).toBeNull();
    expect(operatorView.json().operating).toEqual([{ slug: "acme", name: "Acme Inc" }]);
  });

  it("lets an operator register their own vendor", async () => {
    const owner = await bearerFor();
    const operator = await bearerFor(operatorUser);

    await registerVendor(owner);
    await addOperator(owner, operatorUser.email);
    const own = await registerVendor(operator, { ...acme, slug: "oscar", name: "Oscar Shop" });
    const view = await app.inject({ method: "GET", url: "/api/v1/vendors/me", headers: operator });

    expect(own.statusCode).toBe(201);
    expect(view.json().owned.slug).toBe("oscar");
    expect(view.json().operating).toHaveLength(1);
  });

  it("lets only the owner add operators, and rejects unknown users and duplicates", async () => {
    const owner = await bearerFor();
    const operator = await bearerFor(operatorUser);

    await registerVendor(owner);

    const missing = await addOperator(owner, "nobody@example.com");
    const added = await addOperator(owner, "OP@example.com");
    const duplicate = await addOperator(owner, operatorUser.email);
    const self = await addOperator(owner, validUser.email);
    const byOperator = await addOperator(operator, validUser.email);

    expect(missing.statusCode).toBe(404);
    expect(added.statusCode).toBe(201);
    expect(added.json().members.map((member: { role: string }) => member.role)).toEqual([
      "owner",
      "operator",
    ]);
    expect(duplicate.statusCode).toBe(409);
    expect(self.statusCode).toBe(409);
    expect(byOperator.statusCode).toBe(404);
  });

  it("removes an operator, but never the owner", async () => {
    const owner = await bearerFor();
    const operator = await bearerFor(operatorUser);

    await registerVendor(owner);
    const added = await addOperator(owner, operatorUser.email);
    const [ownerMember, operatorMember] = added.json().members;

    const removeOwner = await app.inject({
      method: "DELETE",
      url: `/api/v1/vendors/me/operators/${ownerMember.userId}`,
      headers: owner,
    });
    const byOperator = await app.inject({
      method: "DELETE",
      url: `/api/v1/vendors/me/operators/${ownerMember.userId}`,
      headers: operator,
    });
    const removed = await app.inject({
      method: "DELETE",
      url: `/api/v1/vendors/me/operators/${operatorMember.userId}`,
      headers: owner,
    });
    const again = await app.inject({
      method: "DELETE",
      url: `/api/v1/vendors/me/operators/${operatorMember.userId}`,
      headers: owner,
    });

    expect(removeOwner.statusCode).toBe(400);
    expect(byOperator.statusCode).toBe(404);
    expect(removed.statusCode).toBe(204);
    expect(again.statusCode).toBe(404);
  });

  it("serves the public vendor page without contact data", async () => {
    const owner = await bearerFor();

    await registerVendor(owner);
    await addOperator(owner, operatorUser.email).catch(() => undefined);
    const response = await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/acme" });
    const body = JSON.stringify(response.json());

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      slug: "acme",
      name: "Acme Inc",
      description: "We sell everything you need.",
      members: [{ firstName: "Jane", lastName: "Doe", role: "owner" }],
    });
    expect(body).not.toMatch(/email|phone|address|userId|example\.com/i);
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/nope" });

    expect(response.statusCode).toBe(404);
  });
});
