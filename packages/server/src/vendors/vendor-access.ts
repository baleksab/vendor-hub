import type { UserRole } from "../users/user-role.ts";
import type { VendorMemberRole } from "./vendor-member-role.ts";
import type { VendorMember } from "./vendor.ts";

export type Actor = {
  userId: string;
  role: UserRole;
};

export type ViewerRole = "administrator" | VendorMemberRole;

export type VendorAccess = {
  viewerRole: ViewerRole;
  canDelete: boolean;
};

export const OWNER_ACCESS: VendorAccess = { viewerRole: "owner", canDelete: true };

export function accessFor(
  actor: Actor,
  memberRole: VendorMemberRole | undefined,
): VendorAccess | undefined {
  if (actor.role === "administrator") {
    return { viewerRole: "administrator", canDelete: true };
  }

  if (memberRole === undefined) {
    return undefined;
  }

  return { viewerRole: memberRole, canDelete: memberRole === "owner" };
}

export function resolveAccess(
  actor: Actor,
  vendor: { members: VendorMember[] },
): VendorAccess | undefined {
  const membership = vendor.members.find((member) => member.userId === actor.userId);

  return accessFor(actor, membership?.role);
}
