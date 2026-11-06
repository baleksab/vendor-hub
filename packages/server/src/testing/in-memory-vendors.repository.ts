import { ConflictError } from "../shared/errors.ts";
import type { VendorMemberRole } from "../vendors/vendor-member-role.ts";
import type { Page } from "../shared/pagination.ts";
import type { Actor } from "../vendors/vendor-access.ts";
import type {
  ManagedVendorRow,
  NewVendor,
  Vendor,
  VendorListItem,
  VendorPatch,
  VendorSummary,
} from "../vendors/vendor.ts";
import { resolveOrder, type ListManagedVendorsQuery } from "../vendors/vendors.schemas.ts";
import {
  ALREADY_MEMBER_MESSAGE,
  ALREADY_OWNER_MESSAGE,
  SLUG_TAKEN_MESSAGE,
  type VendorsRepository,
} from "../vendors/vendors.repository.ts";
import type { InMemoryUsersRepository } from "./in-memory-users.repository.ts";

type StoredVendor = Omit<Vendor, "members">;

type StoredMember = {
  vendorId: string;
  userId: string;
  role: VendorMemberRole;
};

export class InMemoryVendorsRepository implements VendorsRepository {
  readonly vendors: StoredVendor[] = [];
  readonly members: StoredMember[] = [];
  private readonly users: InMemoryUsersRepository;

  constructor(users: InMemoryUsersRepository) {
    this.users = users;
  }

  async create(input: NewVendor): Promise<Vendor> {
    if (this.vendors.some((vendor) => vendor.slug.toLowerCase() === input.slug.toLowerCase())) {
      throw new ConflictError(SLUG_TAKEN_MESSAGE);
    }

    if (this.ownedVendorId(input.ownerId) !== undefined) {
      throw new ConflictError(ALREADY_OWNER_MESSAGE);
    }

    const vendor: StoredVendor = {
      id: crypto.randomUUID(),
      slug: input.slug,
      name: input.name,
      description: input.description,
      createdAt: new Date(),
    };

    this.vendors.push(vendor);
    this.members.push({ vendorId: vendor.id, userId: input.ownerId, role: "owner" });

    return this.toVendor(vendor);
  }

  async list(page: Page): Promise<{ items: VendorListItem[]; total: number }> {
    const newestFirst = [...this.vendors].reverse();

    return {
      items: newestFirst
        .slice(page.offset, page.offset + page.limit)
        .map(({ slug, name, description }) => ({ slug, name, description })),
      total: newestFirst.length,
    };
  }

  async listManaged(
    actor: Actor,
    query: ListManagedVendorsQuery,
  ): Promise<{ items: ManagedVendorRow[]; total: number }> {
    const search = query.search?.toLowerCase();
    const relationRole = query.relation === "owned" ? "owner" : "operator";

    const rows = this.vendors.flatMap((vendor): ManagedVendorRow[] => {
      const members = this.members.filter((member) => member.vendorId === vendor.id);
      const callerRole = members.find((member) => member.userId === actor.userId)?.role;
      const ownerMember = members.find((member) => member.role === "owner");
      const owner = this.users.rows.find((user) => user.id === ownerMember?.userId);

      const visible = actor.role === "administrator" || callerRole !== undefined;
      const relationMatches = query.relation === undefined || callerRole === relationRole;
      const searchMatches =
        search === undefined ||
        vendor.name.toLowerCase().includes(search) ||
        vendor.slug.toLowerCase().includes(search);

      if (!visible || !relationMatches || !searchMatches || owner === undefined) {
        return [];
      }

      return [
        {
          id: vendor.id,
          slug: vendor.slug,
          name: vendor.name,
          description: vendor.description,
          owner: { userId: owner.id, firstName: owner.firstName, lastName: owner.lastName },
          memberCount: members.length,
          callerRole,
          createdAt: vendor.createdAt,
        },
      ];
    });

    const direction = resolveOrder(query) === "asc" ? 1 : -1;
    const sorted = rows.sort((left, right) => {
      const difference =
        query.sort === "name"
          ? left.name.localeCompare(right.name)
          : query.sort === "memberCount"
            ? left.memberCount - right.memberCount
            : left.createdAt.getTime() - right.createdAt.getTime();

      return difference !== 0 ? difference * direction : left.id.localeCompare(right.id);
    });

    return {
      items: sorted.slice(query.offset, query.offset + query.limit),
      total: sorted.length,
    };
  }

  async findById(id: string): Promise<Vendor | undefined> {
    const vendor = this.vendors.find((row) => row.id === id);

    return vendor && this.toVendor(vendor);
  }

  async update(id: string, patch: VendorPatch): Promise<Vendor | undefined> {
    const vendor = this.vendors.find((row) => row.id === id);

    if (vendor === undefined) {
      return undefined;
    }

    Object.assign(vendor, patch);

    return this.toVendor(vendor);
  }

  async softDelete(id: string): Promise<boolean> {
    const index = this.vendors.findIndex((row) => row.id === id);

    if (index === -1) {
      return false;
    }

    this.vendors.splice(index, 1);

    for (let position = this.members.length - 1; position >= 0; position -= 1) {
      if (this.members[position]?.vendorId === id) {
        this.members.splice(position, 1);
      }
    }

    return true;
  }

  async findBySlug(slug: string): Promise<Vendor | undefined> {
    const vendor = this.vendors.find((row) => row.slug.toLowerCase() === slug.toLowerCase());

    return vendor && this.toVendor(vendor);
  }

  async findOwnedBy(userId: string): Promise<Vendor | undefined> {
    const vendorId = this.ownedVendorId(userId);
    const vendor = this.vendors.find((row) => row.id === vendorId);

    return vendor && this.toVendor(vendor);
  }

  async listOperatedBy(userId: string): Promise<VendorSummary[]> {
    return this.members
      .filter((member) => member.userId === userId && member.role === "operator")
      .flatMap((member) => this.vendors.filter((vendor) => vendor.id === member.vendorId))
      .map(({ slug, name }) => ({ slug, name }));
  }

  async addOperator(vendorId: string, userId: string): Promise<void> {
    if (this.members.some((member) => member.vendorId === vendorId && member.userId === userId)) {
      throw new ConflictError(ALREADY_MEMBER_MESSAGE);
    }

    this.members.push({ vendorId, userId, role: "operator" });
  }

  async removeOperator(vendorId: string, userId: string): Promise<boolean> {
    const index = this.members.findIndex(
      (member) =>
        member.vendorId === vendorId && member.userId === userId && member.role === "operator",
    );

    if (index === -1) {
      return false;
    }

    this.members.splice(index, 1);

    return true;
  }

  private ownedVendorId(userId: string): string | undefined {
    return this.members.find((member) => member.userId === userId && member.role === "owner")
      ?.vendorId;
  }

  private toVendor(vendor: StoredVendor): Vendor {
    const members = this.members
      .filter((member) => member.vendorId === vendor.id)
      .flatMap((member) => {
        const user = this.users.rows.find((row) => row.id === member.userId);

        return user === undefined
          ? []
          : [
              {
                userId: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: member.role,
              },
            ];
      });

    return { ...vendor, members };
  }
}
