import type { MyVendorsResponse } from "@vendor-hub/types";

export const MANAGE_VENDORS_PATH = "/manage/vendors";

export const manageVendorPath = (id: string) => `${MANAGE_VENDORS_PATH}/${id}`;

export const manageProductPath = (vendorId: string, productId: string) =>
  `${manageVendorPath(vendorId)}/products/${productId}`;

type Viewer = { role: string } | null;

export function manageVendorsLabelKey(
  user: Viewer,
  vendors: Pick<MyVendorsResponse, "owned" | "operating"> | null,
): "vendors.manage.admin" | "vendors.manage.mine" | null {
  if (user === null) {
    return null;
  }

  if (user.role === "administrator") {
    return "vendors.manage.admin";
  }

  const managesAnything =
    vendors !== null && (vendors.owned !== null || vendors.operating.length > 0);

  return managesAnything ? "vendors.manage.mine" : null;
}
