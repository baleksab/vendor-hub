import type { UserCredentialsLookup } from "../users/user.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../shared/errors.ts";
import { accessFor, resolveAccess, type Actor, type VendorAccess } from "./vendor-access.ts";
import type { ManagedVendorRow, Vendor, VendorListItem, VendorSummary } from "./vendor.ts";
import type {
  AddOperatorRequest,
  ListManagedVendorsQuery,
  ListVendorsQuery,
  RegisterVendorRequest,
  UpdateVendorRequest,
} from "./vendors.schemas.ts";
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

  async list(query: ListVendorsQuery): Promise<{ items: VendorListItem[]; total: number }> {
    return this.repository.list(query);
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

  async listManaged(
    actor: Actor,
    query: ListManagedVendorsQuery,
  ): Promise<{ items: (ManagedVendorRow & VendorAccess)[]; total: number }> {
    const { items, total } = await this.repository.listManaged(actor, query);

    return {
      items: items.flatMap((item) => {
        const access = accessFor(actor, item.callerRole);

        return access === undefined ? [] : [{ ...item, ...access }];
      }),
      total,
    };
  }

  async getManaged(actor: Actor, id: string): Promise<{ vendor: Vendor; access: VendorAccess }> {
    return this.requireVisible(actor, id);
  }

  async update(
    actor: Actor,
    id: string,
    request: UpdateVendorRequest,
  ): Promise<{ vendor: Vendor; access: VendorAccess }> {
    const { access } = await this.requireVisible(actor, id);
    const vendor = await this.repository.update(id, request);

    if (vendor === undefined) {
      throw vendorNotFound();
    }

    return { vendor, access };
  }

  async delete(actor: Actor, id: string): Promise<void> {
    const { access } = await this.requireVisible(actor, id);

    if (!access.canDelete) {
      throw new ForbiddenError("Only the owner can delete the vendor");
    }

    if (!(await this.repository.softDelete(id))) {
      throw vendorNotFound();
    }
  }

  async addOperator(ownerId: string, request: AddOperatorRequest): Promise<Vendor> {
    const vendor = await this.requireOwned(ownerId);

    await this.attachOperator(vendor, request);

    return this.requireOwned(ownerId);
  }

  async addOperatorTo(
    actor: Actor,
    id: string,
    request: AddOperatorRequest,
  ): Promise<{ vendor: Vendor; access: VendorAccess }> {
    const { vendor, access } = await this.requireVisible(actor, id);

    await this.attachOperator(vendor, request);

    const updated = await this.repository.findById(id);

    if (updated === undefined) {
      throw vendorNotFound();
    }

    return { vendor: updated, access };
  }

  async removeOperator(ownerId: string, userId: string): Promise<void> {
    const vendor = await this.requireOwned(ownerId);

    await this.detachOperator(vendor, userId);
  }

  async removeOperatorFrom(actor: Actor, id: string, userId: string): Promise<void> {
    const { vendor } = await this.requireVisible(actor, id);

    await this.detachOperator(vendor, userId);
  }

  private async attachOperator(vendor: Vendor, request: AddOperatorRequest): Promise<void> {
    const user = await this.users.findByEmail(request.email);

    if (user === undefined) {
      throw new NotFoundError("No user with this email exists");
    }

    if (vendor.members.some((member) => member.userId === user.id)) {
      throw new ConflictError(ALREADY_MEMBER_MESSAGE);
    }

    await this.repository.addOperator(vendor.id, user.id);
  }

  private async detachOperator(vendor: Vendor, userId: string): Promise<void> {
    const isOwner = vendor.members.some(
      (member) => member.userId === userId && member.role === "owner",
    );

    if (isOwner) {
      throw new BadRequestError("The owner cannot be removed");
    }

    if (!(await this.repository.removeOperator(vendor.id, userId))) {
      throw new NotFoundError(`Operator ${userId} not found`);
    }
  }

  private async requireVisible(
    actor: Actor,
    id: string,
  ): Promise<{ vendor: Vendor; access: VendorAccess }> {
    const vendor = await this.repository.findById(id);
    const access = vendor && resolveAccess(actor, vendor);

    if (vendor === undefined || access === undefined) {
      throw vendorNotFound();
    }

    return { vendor, access };
  }

  private async requireOwned(ownerId: string): Promise<Vendor> {
    const vendor = await this.repository.findOwnedBy(ownerId);

    if (vendor === undefined) {
      throw new NotFoundError("You do not own a vendor");
    }

    return vendor;
  }
}

function vendorNotFound(): NotFoundError {
  return new NotFoundError("Vendor not found");
}
