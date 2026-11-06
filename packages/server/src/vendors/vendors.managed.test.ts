import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildTestApp, validUser } from "../testing/build-test-app.ts";
import type { InMemoryUsersRepository } from "../testing/in-memory-users.repository.ts";

const unknownId = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";

const ownerUser = { ...validUser, email: "owner@example.com", firstName: "Olga" };
const otherOwner = { ...validUser, email: "other@example.com", firstName: "Otto" };
const operatorUser = { ...validUser, email: "op@example.com", firstName: "Oscar" };
const outsiderUser = { ...validUser, email: "out@example.com", firstName: "Ana" };
const adminUser = { ...validUser, email: "admin@example.com", firstName: "Ada" };

const acme = { slug: "acme", name: "Acme Inc", description: "We sell everything you need." };
const bolt = { slug: "bolt", name: "Bolt 100%", description: "Fast bolts for every need." };

describe("managed vendors routes", () => {
  let app: FastifyInstance;
  let users: InMemoryUsersRepository;

  beforeEach(async () => {
    await app?.close();
    ({ app, repository: users } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  async function bearerFor(user: Record<string, unknown>, role?: "administrator") {
    await app.inject({ method: "POST", url: "/api/v1/users", payload: user });

    const row = users.rows.find(
      (candidate) => candidate.email === String(user.email).toLowerCase(),
    );

    if (row !== undefined && role !== undefined) {
      row.role = role;
    }

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth",
      payload: { email: user.email, password: user.password },
    });

    return { authorization: `Bearer ${login.json().accessToken}` };
  }

  const register = (headers: Record<string, string>, body: Record<string, unknown>) =>
    app.inject({ method: "POST", url: "/api/v1/vendors", headers, payload: body });

  const call = (
    method: "GET" | "PATCH" | "DELETE" | "POST",
    url: string,
    headers: Record<string, string>,
    payload?: Record<string, unknown>,
  ) => app.inject({ method, url: `/api/v1${url}`, headers, payload });

  async function setup() {
    const owner = await bearerFor(ownerUser);
    const other = await bearerFor(otherOwner);
    const operator = await bearerFor(operatorUser);
    const outsider = await bearerFor(outsiderUser);
    const admin = await bearerFor(adminUser, "administrator");
    const created = await register(owner, acme);

    await register(other, bolt);
    await call("POST", "/vendors/me/operators", owner, { email: operatorUser.email });

    return { owner, other, operator, outsider, admin, acmeId: created.json().id as string };
  }

  it("requires a token and keeps managed and me out of :id", async () => {
    const managed = await app.inject({ method: "GET", url: "/api/v1/vendors/managed" });
    const byId = await app.inject({ method: "GET", url: `/api/v1/vendors/${unknownId}` });

    expect(managed.statusCode).toBe(401);
    expect(byId.statusCode).toBe(401);

    const { owner } = await setup();

    expect((await call("GET", "/vendors/managed", owner)).statusCode).toBe(200);
    expect((await call("GET", "/vendors/me", owner)).statusCode).toBe(200);
    expect((await call("GET", "/vendors/not-a-uuid", owner)).statusCode).toBe(400);
  });

  it("lists everything for an administrator and only own vendors for others", async () => {
    const { owner, operator, outsider, admin } = await setup();

    const all = (await call("GET", "/vendors/managed", admin)).json();
    const ownerList = (await call("GET", "/vendors/managed", owner)).json();
    const operatorList = (await call("GET", "/vendors/managed", operator)).json();
    const outsiderList = (await call("GET", "/vendors/managed", outsider)).json();

    expect(all.scope).toBe("all");
    expect(all.meta.total).toBe(2);
    expect(
      all.data.every((item: { viewerRole: string }) => item.viewerRole === "administrator"),
    ).toBe(true);
    expect(ownerList.scope).toBe("mine");
    expect(ownerList.data).toHaveLength(1);
    expect(ownerList.data[0]).toMatchObject({
      slug: "acme",
      memberCount: 2,
      viewerRole: "owner",
      canDelete: true,
      owner: { firstName: "Olga" },
    });
    expect(operatorList.data[0]).toMatchObject({ viewerRole: "operator", canDelete: false });
    expect(outsiderList.data).toEqual([]);
    expect(outsiderList.meta.total).toBe(0);
  });

  it("filters by relation, searches literally and sorts", async () => {
    const { owner, operator, admin } = await setup();

    const operated = (await call("GET", "/vendors/managed?relation=operated", operator)).json();
    const owned = (await call("GET", "/vendors/managed?relation=owned", operator)).json();
    const percent = (await call("GET", "/vendors/managed?search=%25", admin)).json();
    const underscore = (await call("GET", "/vendors/managed?search=_", admin)).json();
    const byCount = (
      await call("GET", "/vendors/managed?sort=memberCount&order=desc", admin)
    ).json();
    const paged = (await call("GET", "/vendors/managed?limit=1&offset=1", admin)).json();
    const none = (await call("GET", "/vendors/managed?relation=operated", owner)).json();

    expect(operated.data).toHaveLength(1);
    expect(owned.data).toEqual([]);
    expect(percent.data.map((item: { slug: string }) => item.slug)).toEqual(["bolt"]);
    expect(underscore.data).toEqual([]);
    expect(byCount.data[0].slug).toBe("acme");
    expect(paged.data).toHaveLength(1);
    expect(paged.meta).toEqual({ total: 2, limit: 1, offset: 1 });
    expect(none.data).toEqual([]);
  });

  it("hides vendors from outsiders with a plain 404", async () => {
    const { outsider, acmeId } = await setup();
    const hidden = await call("GET", `/vendors/${acmeId}`, outsider);
    const missing = await call("GET", `/vendors/${unknownId}`, outsider);

    expect(hidden.statusCode).toBe(404);
    expect(hidden.json()).toEqual({ ...missing.json(), instance: hidden.json().instance });
    expect((await call("PATCH", `/vendors/${acmeId}`, outsider, { name: "Nope" })).statusCode).toBe(
      404,
    );
    expect((await call("DELETE", `/vendors/${acmeId}`, outsider)).statusCode).toBe(404);
  });

  it("lets owner, operator and administrator update, and rejects an empty body", async () => {
    const { owner, operator, admin, acmeId } = await setup();

    for (const [headers, name] of [
      [owner, "Owner Name"],
      [operator, "Operator Name"],
      [admin, "Admin Name"],
    ] as const) {
      const response = await call("PATCH", `/vendors/${acmeId}`, headers, { name });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ name, slug: "acme" });
    }

    expect((await call("PATCH", `/vendors/${acmeId}`, owner, {})).statusCode).toBe(400);
  });

  it("forbids an operator to delete and removes the members with the vendor", async () => {
    const { owner, operator, acmeId } = await setup();

    expect((await call("DELETE", `/vendors/${acmeId}`, operator)).statusCode).toBe(403);
    expect((await call("DELETE", `/vendors/${acmeId}`, owner)).statusCode).toBe(204);
    expect((await call("GET", `/vendors/${acmeId}`, owner)).statusCode).toBe(404);
    expect((await call("GET", "/vendors/managed", operator)).json().data).toEqual([]);
    expect((await register(owner, acme)).statusCode).toBe(201);
  });

  it("lets an administrator delete any vendor", async () => {
    const { admin, acmeId } = await setup();

    expect((await call("DELETE", `/vendors/${acmeId}`, admin)).statusCode).toBe(204);
  });

  it("manages operators by vendor id", async () => {
    const { owner, operator, admin, acmeId } = await setup();
    const ownerId = users.rows.find((row) => row.email === ownerUser.email)?.id;
    const operatorId = users.rows.find((row) => row.email === operatorUser.email)?.id;

    const added = await call("POST", `/vendors/${acmeId}/operators`, admin, {
      email: outsiderUser.email,
    });

    expect(added.statusCode).toBe(201);
    expect(added.json().members).toHaveLength(3);
    expect(
      (await call("POST", `/vendors/${acmeId}/operators`, owner, { email: outsiderUser.email }))
        .statusCode,
    ).toBe(409);
    expect(
      (await call("POST", `/vendors/${acmeId}/operators`, owner, { email: "nobody@example.com" }))
        .statusCode,
    ).toBe(404);
    expect(
      (await call("DELETE", `/vendors/${acmeId}/operators/${ownerId}`, admin)).statusCode,
    ).toBe(400);
    expect(
      (await call("DELETE", `/vendors/${acmeId}/operators/${operatorId}`, operator)).statusCode,
    ).toBe(204);
    expect(
      (await call("DELETE", `/vendors/${acmeId}/operators/${operatorId}`, owner)).statusCode,
    ).toBe(404);
  });
});
