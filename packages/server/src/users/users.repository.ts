import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { notDeleted } from "../db/base-entity.ts";
import type { Database } from "../db/client.ts";
import { users } from "../db/schema.ts";
import { findUniqueViolation } from "../db/unique-violation.ts";
import { ConflictError } from "../shared/errors.ts";
import type { ListUsersQuery } from "./users.schemas.ts";
import type { NewUser, User, UserCredentials, UserCredentialsLookup, UserPatch } from "./user.ts";

export type UsersRepository = UserCredentialsLookup & {
  create(input: NewUser): Promise<User>;
  findById(id: string): Promise<User | undefined>;
  list(query: ListUsersQuery): Promise<{ items: User[]; total: number }>;
  update(id: string, patch: UserPatch): Promise<User | undefined>;
};

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

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function listFilter(query: ListUsersQuery): SQL | undefined {
  const conditions: (SQL | undefined)[] = [notDeleted(users)];

  if (query.search !== undefined) {
    const pattern = `%${escapeLike(query.search)}%`;

    conditions.push(
      or(
        ilike(users.email, pattern),
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, pattern),
      ),
    );
  }

  if (query.role !== undefined) {
    conditions.push(eq(users.role, query.role));
  }

  if (query.country !== undefined) {
    conditions.push(eq(users.country, query.country));
  }

  return and(...conditions);
}

function emailTaken(): ConflictError {
  return new ConflictError("A user with this email already exists");
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
      throw findUniqueViolation(error) !== undefined ? emailTaken() : error;
    }
  }

  async findById(id: string): Promise<User | undefined> {
    const [row] = await this.db
      .select(publicColumns)
      .from(users)
      .where(and(eq(users.id, id), notDeleted(users)));

    return row;
  }

  async list(query: ListUsersQuery): Promise<{ items: User[]; total: number }> {
    const where = listFilter(query);
    const items = await this.db
      .select(publicColumns)
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt), users.id)
      .limit(query.limit)
      .offset(query.offset);

    const [totalRow] = await this.db.select({ total: count() }).from(users).where(where);

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
      throw findUniqueViolation(error) !== undefined ? emailTaken() : error;
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
