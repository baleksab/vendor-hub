import type { FastifyInstance } from "fastify";

import type { JwtEnv } from "../../env.ts";
import { buildApp } from "../app.ts";
import { InMemoryUsersRepository } from "./in-memory-users.repository.ts";
import { InMemoryVendorsRepository } from "./in-memory-vendors.repository.ts";

export const TEST_JWT: JwtEnv = {
  secret: "test-secret-test-secret-test-secret-123",
  expiresInSeconds: 3600,
};

export type TestApp = {
  app: FastifyInstance;
  repository: InMemoryUsersRepository;
  vendorsRepository: InMemoryVendorsRepository;
};

export async function buildTestApp(
  checkDatabase: () => Promise<void> = async () => {},
): Promise<TestApp> {
  const repository = new InMemoryUsersRepository();
  const vendorsRepository = new InMemoryVendorsRepository(repository);
  const app = await buildApp({
    logger: false,
    jwt: TEST_JWT,
    usersRepository: repository,
    vendorsRepository,
    checkDatabase,
  });

  await app.ready();

  return { app, repository, vendorsRepository };
}

export const validUser = {
  email: "Jane@Example.com",
  password: "correct-horse-battery",
  firstName: "Jane",
  lastName: "Doe",
  address: "Main street 1",
  phoneNumber: "+381601234567",
  country: "RS",
};
