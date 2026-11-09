import type { FastifyInstance } from "fastify";

import { authController } from "./auth/auth.controller.ts";
import type { AuthService } from "./auth/auth.service.ts";
import { authenticate } from "./auth/authenticate.ts";
import type { TokenService } from "./auth/token.service.ts";
import { cartController } from "./cart/cart.controller.ts";
import type { CartService } from "./cart/cart.service.ts";
import { categoriesController } from "./categories/categories.controller.ts";
import { countriesController } from "./countries/countries.controller.ts";
import { insightsController } from "./insights/insights.controller.ts";
import type { InsightsService } from "./insights/insights.service.ts";
import { ordersController } from "./orders/orders.controller.ts";
import type { OrdersService } from "./orders/orders.service.ts";
import { productsController, publicProductsController } from "./products/products.controller.ts";
import type { ProductsService } from "./products/products.service.ts";
import { publicReviewsController, reviewsController } from "./reviews/reviews.controller.ts";
import type { ReviewsService } from "./reviews/reviews.service.ts";
import { publicUsersController, usersController } from "./users/users.controller.ts";
import type { UsersService } from "./users/users.service.ts";
import { publicVendorsController, vendorsController } from "./vendors/vendors.controller.ts";
import type { VendorsService } from "./vendors/vendors.service.ts";

export type V1Deps = {
  usersService: UsersService;
  authService: AuthService;
  vendorsService: VendorsService;
  productsService: ProductsService;
  reviewsService: ReviewsService;
  cartService: CartService;
  ordersService: OrdersService;
  insightsService: InsightsService;
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
      await publicScope.register(categoriesController());
      await publicScope.register(publicProductsController(deps.productsService));
      await publicScope.register(publicReviewsController(deps.reviewsService));
      await publicScope.register(cartController(deps.cartService));
    });

    await app.register(async (protectedScope) => {
      authenticate(protectedScope, deps.tokens);
      await protectedScope.register(usersController(deps.usersService));
      await protectedScope.register(vendorsController(deps.vendorsService));
      await protectedScope.register(productsController(deps.productsService));
      await protectedScope.register(reviewsController(deps.reviewsService));
      await protectedScope.register(ordersController(deps.ordersService));
      await protectedScope.register(insightsController(deps.insightsService));
    });
  };
}
