import { hash, verify } from "@node-rs/argon2";

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(passwordHash: string, password: string): Promise<boolean>;
};

// Algorithm is a const enum, unusable with erasableSyntaxOnly. 2 = Argon2id.
const ARGON2ID = 2;

export class Argon2PasswordService implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hash(password, { algorithm: ARGON2ID });
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }
}
