import { SignJWT, decodeJwt } from "jose";
import { describe, expect, it } from "vitest";

import { UnauthorizedError } from "../shared/errors.ts";
import { TokenService } from "./token.service.ts";

const config = { secret: "a-secret-that-is-at-least-32-bytes-long", expiresInSeconds: 3600 };
const userId = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const key = (secret: string) => new TextEncoder().encode(secret);

describe("TokenService", () => {
  it("issues a token with exactly sub, role, iat and exp", async () => {
    const { accessToken, expiresIn } = await new TokenService(config).sign(userId, "regular");
    const claims = decodeJwt(accessToken);

    expect(Object.keys(claims).sort()).toEqual(["exp", "iat", "role", "sub"]);
    expect(claims.sub).toBe(userId);
    expect(claims.role).toBe("regular");
    expect(expiresIn).toBe(3600);
  });

  it("verifies its own token", async () => {
    const tokens = new TokenService(config);
    const { accessToken } = await tokens.sign(userId, "administrator");

    await expect(tokens.verify(accessToken)).resolves.toEqual({ userId, role: "administrator" });
  });

  it("rejects an expired token", async () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const { accessToken } = await new TokenService(config, () => start).sign(userId, "regular");
    const later = new TokenService(config, () => new Date(start.getTime() + 3601 * 1000));

    await expect(later.verify(accessToken)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a tampered token", async () => {
    const tokens = new TokenService(config);
    const { accessToken } = await tokens.sign(userId, "regular");
    const [header, payload, signature] = accessToken.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...decodeJwt(accessToken), role: "administrator" }),
    ).toString("base64url");

    expect(payload).not.toBe(forged);
    await expect(tokens.verify(`${header}.${forged}.${signature}`)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("rejects a token signed with another secret", async () => {
    const other = await new TokenService({
      ...config,
      secret: "another-secret-another-secret-123456",
    }).sign(userId, "regular");

    await expect(new TokenService(config).verify(other.accessToken)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("rejects alg none and other algorithms", async () => {
    const none = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(
      JSON.stringify({ sub: userId, role: "administrator", iat: 1, exp: 9999999999 }),
    ).toString("base64url")}.`;
    const hs512 = await new SignJWT({ role: "regular" })
      .setProtectedHeader({ alg: "HS512" })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(key(config.secret));
    const tokens = new TokenService(config);

    await expect(tokens.verify(none)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(tokens.verify(hs512)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
