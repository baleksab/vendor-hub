import { ConflictError } from "../shared/errors.ts";
import type { NewUser, User, UserCredentials, UserPatch } from "../users/user.ts";
import { resolveUserOrder, type ListUsersQuery } from "../users/users.schemas.ts";
import type { UsersRepository } from "../users/users.repository.ts";

type StoredUser = User & { passwordHash: string; isDeleted: boolean };

export class InMemoryUsersRepository implements UsersRepository {
  readonly rows: StoredUser[] = [];

  async create(input: NewUser): Promise<User> {
    this.assertEmailFree(input.email);

    const now = new Date();
    const row: StoredUser = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    this.rows.push(row);

    return this.toUser(row);
  }

  async findById(id: string): Promise<User | undefined> {
    const row = this.live().find((candidate) => candidate.id === id);

    return row && this.toUser(row);
  }

  async list(query: ListUsersQuery): Promise<{ items: User[]; total: number }> {
    const search = query.search?.toLowerCase();
    const matching = this.live().filter(
      (row) =>
        (search === undefined ||
          `${row.email} ${row.firstName} ${row.lastName}`.toLowerCase().includes(search)) &&
        (query.role === undefined || row.role === query.role) &&
        (query.country === undefined || row.country === query.country),
    );

    const direction = resolveUserOrder(query) === "asc" ? 1 : -1;
    const sorted = matching.sort((left, right) => {
      const difference =
        query.sort === "name"
          ? `${left.lastName} ${left.firstName}`.localeCompare(
              `${right.lastName} ${right.firstName}`,
            )
          : query.sort === "createdAt"
            ? left.createdAt.getTime() - right.createdAt.getTime()
            : left[query.sort].localeCompare(right[query.sort]);

      return difference * direction;
    });

    return {
      items: sorted.slice(query.offset, query.offset + query.limit).map((row) => this.toUser(row)),
      total: matching.length,
    };
  }

  async update(id: string, patch: UserPatch): Promise<User | undefined> {
    const row = this.live().find((candidate) => candidate.id === id);

    if (row === undefined) {
      return undefined;
    }

    if (patch.email !== undefined) {
      this.assertEmailFree(patch.email, id);
    }

    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) {
        Object.assign(row, { [key]: value });
      }
    }

    row.updatedAt = new Date();

    return this.toUser(row);
  }

  async findByEmail(email: string): Promise<UserCredentials | undefined> {
    const row = this.live().find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
    );

    return row && { id: row.id, role: row.role, passwordHash: row.passwordHash };
  }

  private live(): StoredUser[] {
    return this.rows.filter((row) => !row.isDeleted);
  }

  private assertEmailFree(email: string, exceptId?: string): void {
    const taken = this.live().some(
      (row) => row.id !== exceptId && row.email.toLowerCase() === email.toLowerCase(),
    );

    if (taken) {
      throw new ConflictError("A user with this email already exists");
    }
  }

  private toUser(row: StoredUser): User {
    const { passwordHash: _passwordHash, isDeleted: _isDeleted, ...user } = row;

    return { ...user };
  }
}
