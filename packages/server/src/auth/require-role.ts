import type { onRequestAsyncHookHandler } from "fastify";

import { ForbiddenError } from "../shared/errors.ts";
import type { UserRole } from "../users/user-role.ts";

export function requireRole(...roles: UserRole[]): onRequestAsyncHookHandler {
  return async (request) => {
    if (!roles.includes(request.auth.role)) {
      throw new ForbiddenError();
    }
  };
}
