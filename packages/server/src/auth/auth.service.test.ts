import { describe, expect, it } from "vitest";

import { UnauthorizedError } from "../shared/errors.ts";
import type { UserCredentials, UserCredentialsLookup } from "../users/user.ts";
import { AuthService } from "./auth.service.ts";
import type { PasswordHasher } from "./password.service.ts";
import { TokenService } from "./token.service.ts";

const credentials: UserCredentials = {
  id: "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
  role: "regular",
  passwordHash: "hash:secret-password",
};

const passwords: PasswordHasher = {
  hash: async (password) => `hash:${password}`,
  verify: async (hash, password) => hash === `hash:${password}`,
};

const lookup: UserCredentialsLookup = {
  findByEmail: async (email) => (email === "jane@example.com" ? credentials : undefined),
};

const tokens = new TokenService({
  secret: "a-secret-that-is-at-least-32-bytes-long",
  expiresInSeconds: 60,
});
const service = new AuthService(lookup, passwords, tokens);

describe("AuthService.login", () => {
  it("returns a bearer token for valid credentials", async () => {
    const response = await service.login({
      email: "jane@example.com",
      password: "secret-password",
    });

    expect(response.tokenType).toBe("Bearer");
    expect(response.expiresIn).toBe(60);
    await expect(tokens.verify(response.accessToken)).resolves.toEqual({
      userId: credentials.id,
      role: "regular",
    });
  });

  it("gives the same error for an unknown email and a wrong password", async () => {
    const unknown = await service
      .login({ email: "nobody@example.com", password: "x" })
      .catch((e: unknown) => e);
    const wrong = await service
      .login({ email: "jane@example.com", password: "x" })
      .catch((e: unknown) => e);

    expect(unknown).toBeInstanceOf(UnauthorizedError);
    expect(wrong).toBeInstanceOf(UnauthorizedError);
    expect((unknown as UnauthorizedError).message).toBe((wrong as UnauthorizedError).message);
  });
});
