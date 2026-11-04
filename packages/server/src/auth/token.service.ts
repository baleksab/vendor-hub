import { jwtVerify, SignJWT } from "jose";

import type { JwtEnv } from "../../env.ts";
import { UnauthorizedError } from "../shared/errors.ts";
import type { UserRole } from "../users/user-role.ts";
import { TokenClaims } from "./auth.schemas.ts";

const ALGORITHM = "HS256";

export type AuthContext = {
  userId: string;
  role: UserRole;
};

export type IssuedToken = {
  accessToken: string;
  expiresIn: number;
};

export class TokenService {
  private readonly key: Uint8Array;
  private readonly expiresInSeconds: number;
  private readonly now: () => Date;

  constructor(config: JwtEnv, now: () => Date = () => new Date()) {
    this.key = new TextEncoder().encode(config.secret);
    this.expiresInSeconds = config.expiresInSeconds;
    this.now = now;
  }

  async sign(userId: string, role: UserRole): Promise<IssuedToken> {
    const issuedAt = Math.floor(this.now().getTime() / 1000);

    const accessToken = await new SignJWT({ role })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(userId)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + this.expiresInSeconds)
      .sign(this.key);

    return { accessToken, expiresIn: this.expiresInSeconds };
  }

  async verify(token: string): Promise<AuthContext> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [ALGORITHM],
        currentDate: this.now(),
      });
      const claims = TokenClaims.parse(payload);

      return { userId: claims.sub, role: claims.role };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
