import type { FastifyInstance } from "fastify";

import { authController } from "./auth/auth.controller.ts";
import type { AuthService } from "./auth/auth.service.ts";
import { authenticate } from "./auth/authenticate.ts";
import type { TokenService } from "./auth/token.service.ts";
import { countriesController } from "./countries/countries.controller.ts";
import { publicUsersController, usersController } from "./users/users.controller.ts";
import type { UsersService } from "./users/users.service.ts";
import { publicVendorsController, vendorsController } from "./vendors/vendors.controller.ts";
import type { VendorsService } from "./vendors/vendors.service.ts";

export type V1Deps = {
  usersService: UsersService;
  authService: AuthService;
  vendorsService: VendorsService;
  tokens: TokenService;
};

export function v1(deps: V1Deps) {
  return async (app: FastifyInstance): Promise<void> => {
    app.decorateRequest("auth");

    await app.register(async (publicScope) => {
      await publicScope.register(publicUsersController(deps.usersService));
      await publicScope.register(authController(deps.authService));
      await publicScope.register(publicVendorsController(deps.vendorsService));
      await publicScope.register(countriesController());
    });

    await app.register(async (protectedScope) => {
      authenticate(protectedScope, deps.tokens);
      await protectedScope.register(usersController(deps.usersService));
      await protectedScope.register(vendorsController(deps.vendorsService));
    });
  };
}
