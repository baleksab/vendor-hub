import type { UserCredentialsLookup } from "../users/user.ts";
import { BadRequestError, ConflictError, NotFoundError } from "../shared/errors.ts";
import type { Page } from "../shared/pagination.ts";
import type { Vendor, VendorListItem, VendorSummary } from "./vendor.ts";
import type { AddOperatorRequest, RegisterVendorRequest } from "./vendors.schemas.ts";
import {
  ALREADY_MEMBER_MESSAGE,
  ALREADY_OWNER_MESSAGE,
  type VendorsRepository,
} from "./vendors.repository.ts";

export class VendorsService {
  private readonly repository: VendorsRepository;
  private readonly users: UserCredentialsLookup;

  constructor(repository: VendorsRepository, users: UserCredentialsLookup) {
    this.repository = repository;
    this.users = users;
  }

  async register(ownerId: string, request: RegisterVendorRequest): Promise<Vendor> {
    if ((await this.repository.findOwnedBy(ownerId)) !== undefined) {
      throw new ConflictError(ALREADY_OWNER_MESSAGE);
    }

    return this.repository.create({ ...request, ownerId });
  }

  async list(page: Page): Promise<{ items: VendorListItem[]; total: number }> {
    return this.repository.list(page);
  }

  async getMine(
    userId: string,
  ): Promise<{ owned: Vendor | undefined; operating: VendorSummary[] }> {
    const [owned, operating] = await Promise.all([
      this.repository.findOwnedBy(userId),
      this.repository.listOperatedBy(userId),
    ]);

    return { owned, operating };
  }

  async getBySlug(slug: string): Promise<Vendor> {
    const vendor = await this.repository.findBySlug(slug);

    if (vendor === undefined) {
      throw new NotFoundError(`Vendor ${slug} not found`);
    }

    return vendor;
  }

  async addOperator(ownerId: string, request: AddOperatorRequest): Promise<Vendor> {
    const vendor = await this.requireOwned(ownerId);
    const user = await this.users.findByEmail(request.email);

    if (user === undefined) {
      throw new NotFoundError("No user with this email exists");
    }

    if (vendor.members.some((member) => member.userId === user.id)) {
      throw new ConflictError(ALREADY_MEMBER_MESSAGE);
    }

    await this.repository.addOperator(vendor.id, user.id);

    return this.requireOwned(ownerId);
  }

  async removeOperator(ownerId: string, userId: string): Promise<void> {
    const vendor = await this.requireOwned(ownerId);

    if (userId === ownerId) {
      throw new BadRequestError("The owner cannot be removed");
    }

    if (!(await this.repository.removeOperator(vendor.id, userId))) {
      throw new NotFoundError(`Operator ${userId} not found`);
    }
  }

  private async requireOwned(ownerId: string): Promise<Vendor> {
    const vendor = await this.repository.findOwnedBy(ownerId);

    if (vendor === undefined) {
      throw new NotFoundError("You do not own a vendor");
    }

    return vendor;
  }
}
