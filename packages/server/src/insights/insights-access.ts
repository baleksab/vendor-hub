import type { VendorMemberRole } from "../vendors/vendor-member-role.ts";
import type { Vendor } from "../vendors/vendor.ts";

export function memberRoleOf(vendor: Vendor, userId: string): VendorMemberRole | undefined {
  return vendor.members.find((member) => member.userId === userId)?.role;
}
