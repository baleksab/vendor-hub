import { beforeEach, describe, expect, it } from "vitest";

import type { PasswordHasher } from "../auth/password.service.ts";
import { BadRequestError, ConflictError, NotFoundError } from "../shared/errors.ts";
import { InMemoryUsersRepository } from "../testing/in-memory-users.repository.ts";
import type { CreateUserRequest } from "./users.schemas.ts";
import { UsersService } from "./users.service.ts";

const passwords: PasswordHasher = {
  hash: async (password) => `hash:${password}`,
  verify: async (hash, password) => hash === `hash:${password}`,
};

const request: CreateUserRequest = {
  email: "jane@example.com",
  password: "correct-horse-battery",
  firstName: "Jane",
  lastName: "Doe",
  address: "Main street 1",
  phoneNumber: "+381601234567",
  country: "RS",
};

describe("UsersService", () => {
  let repository: InMemoryUsersRepository;
  let service: UsersService;

  beforeEach(() => {
    repository = new InMemoryUsersRepository();
    service = new UsersService(repository, passwords);
  });

  it("creates only regular users and stores a hash", async () => {
    const user = await service.create(request);

    expect(user.role).toBe("regular");
    expect(repository.rows[0]?.passwordHash).toBe("hash:correct-horse-battery");
  });

  it("maps a duplicate email to ConflictError", async () => {
    await service.create(request);

    await expect(service.create({ ...request, email: "JANE@example.com" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("gets, lists and updates users", async () => {
    const user = await service.create(request);

    await expect(service.get(user.id)).resolves.toMatchObject({ email: "jane@example.com" });
    await expect(service.list({ limit: 20, offset: 0 })).resolves.toMatchObject({ total: 1 });
    await expect(service.update(user.id, { firstName: "Janet" })).resolves.toMatchObject({
      firstName: "Janet",
    });
  });

  it("can update the role", async () => {
    const user = await service.create(request);

    await expect(service.update(user.id, { role: "administrator" })).resolves.toMatchObject({
      role: "administrator",
    });
  });

  it("hashes the password on update and never sends the plain one", async () => {
    const user = await service.create(request);

    await service.update(user.id, { password: "another-password" });

    expect(repository.rows[0]?.passwordHash).toBe("hash:another-password");
    expect(repository.rows[0]).not.toHaveProperty("password");
  });

  it("does not let an actor change their own role", async () => {
    const user = await service.create(request);

    await expect(
      service.update(user.id, { role: "administrator" }, user.id),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(service.update(user.id, { firstName: "Janet" }, user.id)).resolves.toMatchObject({
      firstName: "Janet",
    });
  });

  it("lets an actor change another user's role", async () => {
    const user = await service.create(request);
    const other = await service.create({ ...request, email: "other@example.com" });

    await expect(
      service.update(user.id, { role: "administrator" }, other.id),
    ).resolves.toMatchObject({ role: "administrator" });
  });

  it("throws NotFoundError for a missing id", async () => {
    const id = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";

    await expect(service.get(id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.update(id, { firstName: "X" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects an empty update", async () => {
    const user = await service.create(request);

    await expect(service.update(user.id, {})).rejects.toBeInstanceOf(BadRequestError);
  });

  it("maps an email clash on update to ConflictError", async () => {
    await service.create(request);
    const other = await service.create({ ...request, email: "other@example.com" });

    await expect(service.update(other.id, { email: "jane@example.com" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});
