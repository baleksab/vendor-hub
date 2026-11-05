import type { PasswordHasher } from "../auth/password.service.ts";
import { BadRequestError, NotFoundError } from "../shared/errors.ts";
import type { Page } from "../shared/pagination.ts";
import type { User } from "./user.ts";
import type { CreateUserRequest, UpdateUserRequest } from "./users.schemas.ts";
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

  async list(page: Page): Promise<{ items: User[]; total: number }> {
    return this.repository.list(page);
  }

  async update(id: string, request: UpdateUserRequest): Promise<User> {
    if (Object.values(request).every((value) => value === undefined)) {
      throw new BadRequestError("At least one field must be present");
    }

    const user = await this.repository.update(id, request);

    if (user === undefined) {
      throw new NotFoundError(`User ${id} not found`);
    }

    return user;
  }
}
