import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../app.ts";
import type { DatabaseHandle } from "../db/client.ts";
import { users } from "../db/schema.ts";
import { TEST_JWT, validUser } from "../testing/build-test-app.ts";
import { createTestDatabase, truncateAll } from "../testing/test-database.ts";
import { DrizzleVendorsRepository } from "../vendors/vendors.repository.ts";
import { DrizzleUsersRepository } from "./users.repository.ts";

describe("users and auth against Postgres", () => {
  let handle: DatabaseHandle;
  let app: FastifyInstance;

  beforeAll(async () => {
    handle = await createTestDatabase();
    app = await buildApp({
      logger: false,
      jwt: TEST_JWT,
      usersRepository: new DrizzleUsersRepository(handle.db),
      vendorsRepository: new DrizzleVendorsRepository(handle.db),
      checkDatabase: async () => {
        await handle.pool.query("select 1");
      },
    });
    await app.ready();
  });

  beforeEach(async () => {
    await truncateAll(handle);
  });

  afterAll(async () => {
    await app.close();
    await handle.pool.end().catch(() => undefined);
  });

  const register = (body: Record<string, unknown> = validUser) =>
    app.inject({ method: "POST", url: "/api/v1/users", payload: body });

  const login = (email: string = validUser.email, password: string = validUser.password) =>
    app.inject({ method: "POST", url: "/api/v1/auth", payload: { email, password } });

  async function bearer(): Promise<{ authorization: string }> {
    await register();
    await handle.db.update(users).set({ role: "administrator" });

    return { authorization: `Bearer ${(await login()).json().accessToken}` };
  }

  it("runs the full flow: create, login, call protected routes", async () => {
    const created = await register();
    const id = created.json().id;
    const regular = { authorization: `Bearer ${(await login()).json().accessToken}` };

    expect(created.statusCode).toBe(201);
    expect(
      (await app.inject({ method: "GET", url: "/api/v1/users", headers: regular })).statusCode,
    ).toBe(403);

    await handle.db.update(users).set({ role: "administrator" });
    const headers = { authorization: `Bearer ${(await login()).json().accessToken}` };

    const list = await app.inject({ method: "GET", url: "/api/v1/users", headers });
    const get = await app.inject({ method: "GET", url: `/api/v1/users/${id}`, headers });

    expect(list.json().meta.total).toBe(1);
    expect(get.json().email).toBe("jane@example.com");
    expect((await app.inject({ method: "GET", url: "/api/v1/users" })).statusCode).toBe(401);
  });

  it("stores an argon2id hash", async () => {
    await register();
    const [row] = await handle.db.select({ hash: users.passwordHash }).from(users);

    expect(row?.hash).toMatch(/^\$argon2id\$/);
  });

  it("updates fields and updatedAt, and returns 404 for a missing id", async () => {
    const headers = await bearer();
    const [row] = await handle.db.select().from(users);
    const id = row?.id ?? "";

    await new Promise((resolve) => setTimeout(resolve, 10));
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${id}`,
      headers,
      payload: { firstName: "Janet" },
    });

    expect(patch.json().firstName).toBe("Janet");
    expect(new Date(patch.json().updatedAt).getTime()).toBeGreaterThan(
      new Date(patch.json().createdAt).getTime(),
    );

    const missing = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
      headers,
      payload: { firstName: "X" },
    });

    expect(missing.statusCode).toBe(404);
  });

  it("returns 409 for the same email in a different case, also on update", async () => {
    await register();
    const duplicate = await register({ ...validUser, email: "JANE@example.com" });
    const other = await register({ ...validUser, email: "other@example.com" });

    await handle.db
      .update(users)
      .set({ role: "administrator" })
      .where(eq(users.email, "jane@example.com"));

    const headers = { authorization: `Bearer ${(await login()).json().accessToken}` };
    const update = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${other.json().id}`,
      headers,
      payload: { email: "Jane@Example.com" },
    });

    expect(duplicate.statusCode).toBe(409);
    expect(update.statusCode).toBe(409);
  });

  it("puts the updated role into the next token", async () => {
    const headers = await bearer();
    const other = (await register({ ...validUser, email: "other@example.com" })).json();

    await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${other.id}`,
      headers,
      payload: { role: "administrator" },
    });
    const token = (await login("other@example.com")).json().accessToken as string;
    const claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());

    expect(claims.role).toBe("administrator");
  });

  it("hides soft-deleted rows from list, get, login and update, and frees the email", async () => {
    const headers = await bearer();
    const [row] = await handle.db.select().from(users);
    const id = row?.id ?? "";

    await handle.db
      .update(users)
      .set({ isDeleted: true, deletedAt: sql`now()` })
      .where(eq(users.id, id));

    const list = await app.inject({ method: "GET", url: "/api/v1/users", headers });
    const get = await app.inject({ method: "GET", url: `/api/v1/users/${id}`, headers });
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${id}`,
      headers,
      payload: { firstName: "X" },
    });

    expect(list.json().meta.total).toBe(0);
    expect(get.statusCode).toBe(404);
    expect(patch.statusCode).toBe(404);
    expect((await login()).statusCode).toBe(401);
    expect((await register()).statusCode).toBe(201);
  });

  it("returns 503 on /health when the pool is closed", async () => {
    const closed = await createTestDatabase();
    const closedApp = await buildApp({
      logger: false,
      jwt: TEST_JWT,
      usersRepository: new DrizzleUsersRepository(closed.db),
      vendorsRepository: new DrizzleVendorsRepository(closed.db),
      checkDatabase: async () => {
        await closed.pool.query("select 1");
      },
    });

    expect((await closedApp.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);
    await closed.pool.end();
    expect((await closedApp.inject({ method: "GET", url: "/health" })).statusCode).toBe(503);
    await closedApp.close();
  });
});
