import { getMyVendors } from "../api/endpoints/vendors.server";
import type { Session } from "../auth/session.server";
import type { MyVendorsResponse } from "@vendor-hub/types";

const cache = new WeakMap<Request, Promise<MyVendorsResponse>>();

export function loadMyVendors(request: Request, session: Session): Promise<MyVendorsResponse> {
  let result = cache.get(request);

  if (result === undefined) {
    result = getMyVendors(session.token);
    cache.set(request, result);
  }

  return result;
}
