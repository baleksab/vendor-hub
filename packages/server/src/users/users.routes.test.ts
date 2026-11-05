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

  it("lets a logged-in user list, get and update users", async () => {
    const headers = await bearer();
    const list = await app.inject({ method: "GET", url: "/api/v1/users?limit=5", headers });
    const id = list.json().data[0].id;

    expect(list.json().meta).toEqual({ total: 1, limit: 5, offset: 0 });

    const get = await app.inject({ method: "GET", url: `/api/v1/users/${id}`, headers });
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${id}`,
      headers,
      payload: { firstName: "Janet", role: "administrator" },
    });

    expect(get.statusCode).toBe(200);
    expect(patch.json()).toMatchObject({ firstName: "Janet", role: "administrator" });
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

  it("returns 404 for a missing user and 400 for an empty patch", async () => {
    const headers = await bearer();
    const missing = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
      headers,
      payload: { firstName: "X" },
    });
    const id = repository.rows[0]?.id;
    const empty = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${id}`,
      headers,
      payload: {},
    });

    expect(missing.statusCode).toBe(404);
    expect(empty.statusCode).toBe(400);
  });

  it("puts the updated role into the next token", async () => {
    const headers = await bearer();
    const id = repository.rows[0]?.id;

    await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${id}`,
      headers,
      payload: { role: "administrator" },
    });
    const token = (await login()).json().accessToken as string;
    const claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());

    expect(claims.role).toBe("administrator");
  });
});
