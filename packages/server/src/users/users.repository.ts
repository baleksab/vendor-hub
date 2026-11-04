import { and, count, desc, eq, sql } from "drizzle-orm";
import pg from "pg";

import { notDeleted } from "../db/base-entity.ts";
import type { Database } from "../db/client.ts";
import { users } from "../db/schema.ts";
import { ConflictError } from "../shared/errors.ts";
import type { Page } from "../shared/pagination.ts";
import type { NewUser, User, UserCredentials, UserCredentialsLookup, UserPatch } from "./user.ts";

export type UsersRepository = UserCredentialsLookup & {
  create(input: NewUser): Promise<User>;
  findById(id: string): Promise<User | undefined>;
  list(page: Page): Promise<{ items: User[]; total: number }>;
  update(id: string, patch: UserPatch): Promise<User | undefined>;
};

const UNIQUE_VIOLATION = "23505";

const publicColumns = {
  id: users.id,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  address: users.address,
  phoneNumber: users.phoneNumber,
  country: users.country,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

function emailTaken(): ConflictError {
  return new ConflictError("A user with this email already exists");
}

function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined;

  return [error, cause].some(
    (candidate) => candidate instanceof pg.DatabaseError && candidate.code === UNIQUE_VIOLATION,
  );
}

export class DrizzleUsersRepository implements UsersRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(input: NewUser): Promise<User> {
    try {
      const [row] = await this.db.insert(users).values(input).returning(publicColumns);

      if (row === undefined) {
        throw new Error("Insert returned no row");
      }

      return row;
    } catch (error) {
      throw isUniqueViolation(error) ? emailTaken() : error;
    }
  }

  async findById(id: string): Promise<User | undefined> {
    const [row] = await this.db
      .select(publicColumns)
      .from(users)
      .where(and(eq(users.id, id), notDeleted(users)));

    return row;
  }

  async list(page: Page): Promise<{ items: User[]; total: number }> {
    const items = await this.db
      .select(publicColumns)
      .from(users)
      .where(notDeleted(users))
      .orderBy(desc(users.createdAt), users.id)
      .limit(page.limit)
      .offset(page.offset);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(users)
      .where(notDeleted(users));

    return { items, total: totalRow?.total ?? 0 };
  }

  async update(id: string, patch: UserPatch): Promise<User | undefined> {
    try {
      const [row] = await this.db
        .update(users)
        .set(patch)
        .where(and(eq(users.id, id), notDeleted(users)))
        .returning(publicColumns);

      return row;
    } catch (error) {
      throw isUniqueViolation(error) ? emailTaken() : error;
    }
  }

  async findByEmail(email: string): Promise<UserCredentials | undefined> {
    const [row] = await this.db
      .select({ id: users.id, role: users.role, passwordHash: users.passwordHash })
      .from(users)
      .where(and(sql`lower(${users.email}) = lower(${email})`, notDeleted(users)));

    return row;
  }
}
