import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../app.ts";
import type { DatabaseHandle } from "../db/client.ts";
import { vendorMembers, vendors } from "../db/schema.ts";
import { TEST_JWT, validUser } from "../testing/build-test-app.ts";
import { createTestDatabase, truncateAll } from "../testing/test-database.ts";
import { DrizzleUsersRepository } from "../users/users.repository.ts";
import { DrizzleVendorsRepository } from "./vendors.repository.ts";

const acme = { slug: "acme", name: "Acme Inc", description: "We sell everything you need." };
const operatorUser = { ...validUser, email: "op@example.com" };

describe("vendors against Postgres", () => {
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

  async function softDeleteVendor(slug: string): Promise<void> {
    const [vendor] = await handle.db.select().from(vendors).where(eq(vendors.slug, slug));

    await handle.db
      .update(vendorMembers)
      .set({ isDeleted: true, deletedAt: sql`now()` })
      .where(eq(vendorMembers.vendorId, vendor?.id ?? ""));
    await handle.db
      .update(vendors)
      .set({ isDeleted: true, deletedAt: sql`now()` })
      .where(eq(vendors.id, vendor?.id ?? ""));
  }

  it("creates the vendor and the owner member in one registration", async () => {
    const response = await registerVendor(await bearerFor());
    const members = await handle.db.select().from(vendorMembers);

    expect(response.statusCode).toBe(201);
    expect(members).toHaveLength(1);
    expect(members[0]?.role).toBe("owner");
  });

  it("leaves no vendor behind when the owner insert fails", async () => {
    const repository = new DrizzleVendorsRepository(handle.db);
    const missingUser = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";

    await expect(repository.create({ ...acme, ownerId: missingUser })).rejects.toThrow();
    expect(await handle.db.select().from(vendors)).toHaveLength(0);
  });

  it("enforces one owned vendor per user and a unique slug in any case", async () => {
    const first = await bearerFor();
    const second = await bearerFor(operatorUser);

    await registerVendor(first);

    const sameOwner = await registerVendor(first, { ...acme, slug: "other" });
    const sameSlug = await registerVendor(second, { ...acme, slug: "acme" });

    expect(sameOwner.statusCode).toBe(409);
    expect(sameSlug.statusCode).toBe(409);
    expect(await handle.db.select().from(vendors)).toHaveLength(1);
  });

  it("rejects a second owner row for the same user and for the same vendor at database level", async () => {
    const first = await bearerFor();
    const second = await bearerFor(operatorUser);
    const created = await registerVendor(first);
    const [owner] = await handle.db.select().from(vendorMembers);
    const other = await registerVendor(second, { ...acme, slug: "other" });
    const otherVendorId = other.json().id;

    await expect(
      handle.db
        .insert(vendorMembers)
        .values({ vendorId: otherVendorId, userId: owner?.userId ?? "", role: "owner" }),
    ).rejects.toThrow();
    await expect(
      handle.db.insert(vendorMembers).values({
        vendorId: created.json().id,
        userId: other.json().members[0].userId,
        role: "owner",
      }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate membership", async () => {
    const owner = await bearerFor();

    await bearerFor(operatorUser);
    await registerVendor(owner);

    const add = () =>
      app.inject({
        method: "POST",
        url: "/api/v1/vendors/me/operators",
        headers: owner,
        payload: { email: operatorUser.email },
      });

    expect((await add()).statusCode).toBe(201);
    expect((await add()).statusCode).toBe(409);
  });

  it("frees the slug and lets the owner register again after a soft delete", async () => {
    const owner = await bearerFor();

    await registerVendor(owner);
    await softDeleteVendor("acme");

    const lookup = await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/acme" });
    const again = await registerVendor(owner);

    expect(lookup.statusCode).toBe(404);
    expect(again.statusCode).toBe(201);
  });

  it("returns operated vendors and hides contact data on the public page", async () => {
    const owner = await bearerFor();
    const operator = await bearerFor(operatorUser);

    await registerVendor(owner);
    await app.inject({
      method: "POST",
      url: "/api/v1/vendors/me/operators",
      headers: owner,
      payload: { email: operatorUser.email },
    });

    const me = await app.inject({ method: "GET", url: "/api/v1/vendors/me", headers: operator });
    const publicPage = await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/ACME" });

    expect(me.json().operating).toEqual([{ slug: "acme", name: "Acme Inc" }]);
    expect(publicPage.json().members).toHaveLength(2);
    expect(JSON.stringify(publicPage.json())).not.toMatch(/email|phone|address|example\.com/i);
  });

  it("lists only live vendors, newest first", async () => {
    const first = await bearerFor();
    const second = await bearerFor(operatorUser);

    await registerVendor(first);
    await registerVendor(second, { ...acme, slug: "second", name: "Second Shop" });
    await softDeleteVendor("acme");

    const list = await app.inject({ method: "GET", url: "/api/v1/vendors" });

    expect(list.json().meta.total).toBe(1);
    expect(list.json().data.map((vendor: { slug: string }) => vendor.slug)).toEqual(["second"]);
  });
});
