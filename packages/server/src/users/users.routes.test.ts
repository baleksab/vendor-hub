import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildTestApp, validUser } from "../testing/build-test-app.ts";
import type { InMemoryUsersRepository } from "../testing/in-memory-users.repository.ts";

describe("users and auth routes", () => {
  let app: FastifyInstance;
  let repository: InMemoryUsersRepository;

  beforeEach(async () => {
    await app?.close();
    ({ app, repository } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  async function register(body: Record<string, unknown> = validUser) {
    return app.inject({ method: "POST", url: "/api/v1/users", payload: body });
  }

  async function login(email = validUser.email, password = validUser.password) {
    return app.inject({ method: "POST", url: "/api/v1/auth", payload: { email, password } });
  }

  async function bearer(): Promise<{ authorization: string }> {
    await register();
    const { accessToken } = (await login()).json();

    return { authorization: `Bearer ${accessToken}` };
  }

  const adminEmail = "admin@example.com";

  async function adminBearer(): Promise<{ authorization: string }> {
    await register({ ...validUser, email: adminEmail });

    const admin = repository.rows.find((row) => row.email === adminEmail);

    if (admin === undefined) {
      throw new Error("Administrator was not registered");
    }

    admin.role = "administrator";

    const { accessToken } = (await login(adminEmail)).json();

    return { authorization: `Bearer ${accessToken}` };
  }

  it("registers a regular user without exposing the password", async () => {
    const response = await register({ ...validUser, role: "administrator" });
    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(response.headers.location).toBe(`/api/v1/users/${body.id}`);
    expect(body.role).toBe("regular");
    expect(body.email).toBe("jane@example.com");
    expect(JSON.stringify(body)).not.toMatch(/password|hash/i);
    expect(repository.rows[0]?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("returns 400 problem+json naming the missing field", async () => {
    const { firstName: _firstName, ...body } = validUser;
    const response = await register(body);

    expect(response.statusCode).toBe(400);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.json().errors).toEqual([expect.objectContaining({ path: "firstName" })]);
  });

  it("returns 409 for the same email in a different case", async () => {
    await register();
    const response = await register({ ...validUser, email: "JANE@EXAMPLE.COM" });

    expect(response.statusCode).toBe(409);
  });

  it("logs in and returns the same 401 for a wrong email and a wrong password", async () => {
    await register();
    const ok = await login();
    const wrongPassword = await login(validUser.email, "wrong-password");
    const wrongEmail = await login("nobody@example.com", "wrong-password");

    expect(ok.statusCode).toBe(200);
    expect(ok.json().tokenType).toBe("Bearer");
    expect(wrongPassword.statusCode).toBe(401);
    expect(wrongEmail.statusCode).toBe(401);
    expect(wrongEmail.json().detail).toBe(wrongPassword.json().detail);
  });

  it("protects every users route except create", async () => {
    const id = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
    const calls = [
      app.inject({ method: "GET", url: "/api/v1/users" }),
      app.inject({ method: "GET", url: `/api/v1/users/${id}` }),
      app.inject({ method: "PATCH", url: `/api/v1/users/${id}`, payload: { firstName: "X" } }),
      app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: "Bearer garbage" },
      }),
    ];

    for (const response of await Promise.all(calls)) {
      expect(response.statusCode).toBe(401);
    }
  });

  it("returns 403 for a regular user on list, get and patch", async () => {
    const headers = await bearer();
    const id = repository.rows[0]?.id;
    const calls = [
      app.inject({ method: "GET", url: "/api/v1/users", headers }),
      app.inject({ method: "GET", url: `/api/v1/users/${id}`, headers }),
      app.inject({
        method: "PATCH",
        url: `/api/v1/users/${id}`,
        headers,
        payload: { role: "administrator" },
      }),
    ];

    for (const response of await Promise.all(calls)) {
      expect(response.statusCode).toBe(403);
    }

    expect(repository.rows[0]?.role).toBe("regular");
  });

  it("lets an administrator list and get users", async () => {
    const headers = await adminBearer();
    await register({ ...validUser, email: "other@example.com" });

    const list = await app.inject({ method: "GET", url: "/api/v1/users?limit=5", headers });
    const id = list.json().data[0].id;
    const get = await app.inject({ method: "GET", url: `/api/v1/users/${id}`, headers });

    expect(list.json().meta).toEqual({ total: 2, limit: 5, offset: 0 });
    expect(get.statusCode).toBe(200);
  });

  it("filters the list by search, role and country", async () => {
    const headers = await adminBearer();

    await register({ ...validUser, email: "milica@example.com", firstName: "Milica" });
    await register({ ...validUser, email: "petar@example.com", firstName: "Petar" });

    const bySearch = await app.inject({ method: "GET", url: "/api/v1/users?search=mili", headers });
    const byRole = await app.inject({
      method: "GET",
      url: "/api/v1/users?role=administrator",
      headers,
    });
    const byCountry = await app.inject({ method: "GET", url: "/api/v1/users?country=DE", headers });

    expect(bySearch.json().meta.total).toBe(1);
    expect(byRole.json().meta.total).toBe(1);
    expect(byCountry.json().meta.total).toBe(0);
  });

  it("patches one field and leaves the others unchanged", async () => {
    const headers = await adminBearer();
    const target = (await register({ ...validUser, email: "other@example.com" })).json();
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}`,
      headers,
      payload: { firstName: "Janet" },
    });

    expect(patch.statusCode).toBe(200);
    expect(patch.json()).toEqual({
      ...target,
      firstName: "Janet",
      updatedAt: expect.any(String),
    });
  });

  it("patches every field and never returns the password or hash", async () => {
    const headers = await adminBearer();
    const target = (await register({ ...validUser, email: "other@example.com" })).json();
    const payload = {
      email: "changed@example.com",
      password: "brand-new-password",
      firstName: "Changed",
      lastName: "Person",
      address: "Other street 2",
      phoneNumber: "+381607654321",
      country: "DE",
      role: "administrator",
    };
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}`,
      headers,
      payload,
    });
    const { password: _password, ...expected } = payload;

    expect(patch.statusCode).toBe(200);
    expect(patch.json()).toMatchObject(expected);
    expect(JSON.stringify(patch.json())).not.toMatch(/password|hash/i);
  });

  it("lets the user log in with the new password only", async () => {
    const headers = await adminBearer();
    const target = (await register({ ...validUser, email: "other@example.com" })).json();

    await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}`,
      headers,
      payload: { password: "brand-new-password" },
    });

    expect((await login("other@example.com", "brand-new-password")).statusCode).toBe(200);
    expect((await login("other@example.com", validUser.password)).statusCode).toBe(401);
  });

  it("returns 404 for a missing user, 400 for an empty patch and 409 for a taken email", async () => {
    const headers = await adminBearer();
    const target = (await register({ ...validUser, email: "other@example.com" })).json();
    const missing = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
      headers,
      payload: { firstName: "X" },
    });
    const empty = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}`,
      headers,
      payload: {},
    });
    const taken = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}`,
      headers,
      payload: { email: adminEmail },
    });

    expect(missing.statusCode).toBe(404);
    expect(empty.statusCode).toBe(400);
    expect(taken.statusCode).toBe(409);
  });

  it("rejects an administrator changing their own role but allows other fields", async () => {
    const headers = await adminBearer();
    const id = repository.rows[0]?.id;
    const role = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${id}`,
      headers,
      payload: { role: "regular" },
    });
    const name = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${id}`,
      headers,
      payload: { firstName: "Boss" },
    });

    expect(role.statusCode).toBe(400);
    expect(name.statusCode).toBe(200);
    expect(repository.rows[0]?.role).toBe("administrator");
  });

  it("returns the current user on /users/me and requires a token", async () => {
    const headers = await bearer();
    const me = await app.inject({ method: "GET", url: "/api/v1/users/me", headers });
    const anonymous = await app.inject({ method: "GET", url: "/api/v1/users/me" });

    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ id: repository.rows[0]?.id, email: "jane@example.com" });
    expect(JSON.stringify(me.json())).not.toMatch(/password|hash/i);
    expect(anonymous.statusCode).toBe(401);
  });

  it("puts the updated role into the next token", async () => {
    const headers = await adminBearer();
    const target = (await register({ ...validUser, email: "other@example.com" })).json();

    await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${target.id}`,
      headers,
      payload: { role: "administrator" },
    });
    const token = (await login("other@example.com")).json().accessToken as string;
    const claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());

    expect(claims.role).toBe("administrator");
  });
});
