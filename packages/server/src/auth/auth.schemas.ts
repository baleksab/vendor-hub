import { z } from "zod";

import { UserRoleSchema } from "../users/user-role.ts";

export const LoginRequest = z
  .object({
    email: z.string().trim().toLowerCase(),
    password: z.string(),
  })
  .meta({ id: "LoginRequest" });

export const TokenResponse = z
  .object({
    accessToken: z.string(),
    tokenType: z.literal("Bearer"),
    expiresIn: z.number().int().positive(),
  })
  .meta({ id: "TokenResponse" });

export const TokenClaims = z.object({
  sub: z.uuid(),
  role: UserRoleSchema,
  iat: z.number().int(),
  exp: z.number().int(),
});

export type LoginRequest = z.infer<typeof LoginRequest>;
export type TokenResponse = z.infer<typeof TokenResponse>;
export type TokenClaims = z.infer<typeof TokenClaims>;
