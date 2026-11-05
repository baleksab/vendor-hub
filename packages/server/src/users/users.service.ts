import type { PasswordHasher } from "../auth/password.service.ts";
import { BadRequestError, NotFoundError } from "../shared/errors.ts";
import type { User, UserPatch } from "./user.ts";
import type { CreateUserRequest, ListUsersQuery, UpdateUserRequest } from "./users.schemas.ts";
import type { UsersRepository } from "./users.repository.ts";

export class UsersService {
  private readonly repository: UsersRepository;
  private readonly passwords: PasswordHasher;

  constructor(repository: UsersRepository, passwords: PasswordHasher) {
    this.repository = repository;
    this.passwords = passwords;
  }

  async create(request: CreateUserRequest): Promise<User> {
    const { password, ...profile } = request;

    return this.repository.create({
      ...profile,
      passwordHash: await this.passwords.hash(password),
      role: "regular",
    });
  }

  async get(id: string): Promise<User> {
    const user = await this.repository.findById(id);

    if (user === undefined) {
      throw new NotFoundError(`User ${id} not found`);
    }

    return user;
  }

  async list(query: ListUsersQuery): Promise<{ items: User[]; total: number }> {
    return this.repository.list(query);
  }

  async update(id: string, request: UpdateUserRequest, actorId?: string): Promise<User> {
    if (Object.values(request).every((value) => value === undefined)) {
      throw new BadRequestError("At least one field must be present");
    }

    if (id === actorId && request.role !== undefined) {
      throw new BadRequestError("You cannot change your own role");
    }

    const { password, ...profile } = request;
    const patch: UserPatch = { ...profile };

    if (password !== undefined) {
      patch.passwordHash = await this.passwords.hash(password);
    }

    const user = await this.repository.update(id, patch);

    if (user === undefined) {
      throw new NotFoundError(`User ${id} not found`);
    }

    return user;
  }
}
