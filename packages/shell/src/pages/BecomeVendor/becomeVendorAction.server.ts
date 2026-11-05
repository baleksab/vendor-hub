import { redirect } from "react-router";

import { registerVendor } from "../../api/endpoints/vendors.server";
import { assertSameOrigin } from "../../auth/sameOrigin.server";
import { requireUser } from "../../auth/session.server";
import { failed, invalid, readValues } from "../../forms/formErrors.server";
import { becomeVendorSchema } from "./becomeVendorSchema";

export async function becomeVendorAction(request: Request) {
  assertSameOrigin(request);

  const session = await requireUser(request);
  const values = await readValues(request);
  const vendor = becomeVendorSchema.safeParse(values);

  if (!vendor.success) {
    return invalid(vendor.error, values);
  }

  try {
    await registerVendor(session.token, vendor.data);
  } catch (error) {
    return failed(error, "vendor", values);
  }

  return redirect("/vendor");
}
