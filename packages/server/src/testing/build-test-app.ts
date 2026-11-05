import type { FastifyInstance } from "fastify";

import type { JwtEnv } from "../../env.ts";
import { buildApp } from "../app.ts";
import { InMemoryUsersRepository } from "./in-memory-users.repository.ts";

export const TEST_JWT: JwtEnv = {
  secret: "test-secret-test-secret-test-secret-123",
  expiresInSeconds: 3600,
};

export type TestApp = {
  app: FastifyInstance;
  repository: InMemoryUsersRepository;
};

export async function buildTestApp(
  checkDatabase: () => Promise<void> = async () => {},
): Promise<TestApp> {
  const repository = new InMemoryUsersRepository();
  const app = await buildApp({
    logger: false,
    jwt: TEST_JWT,
    usersRepository: repository,
    checkDatabase,
  });

  await app.ready();

  return { app, repository };
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
