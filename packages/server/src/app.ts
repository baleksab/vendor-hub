import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import Fastify, { type FastifyInstance } from "fastify";
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import type { CartEnv, ImageEnv, JwtEnv, OrdersEnv } from "../env.ts";
import { AuthService } from "./auth/auth.service.ts";
import { Argon2PasswordService } from "./auth/password.service.ts";
import { CartService } from "./cart/cart.service.ts";
import { TokenService } from "./auth/token.service.ts";
import { healthController, type DatabaseCheck } from "./health/health.controller.ts";
import { registerOrderScheduler } from "./orders/order-scheduler.ts";
import type { OrdersRepository } from "./orders/orders.repository.ts";
import { OrdersService, type Clock } from "./orders/orders.service.ts";
import type { PaymentGateway } from "./payments/payment-gateway.ts";
import type { ImageStorage } from "./products/image-storage.ts";
import type { ProductsRepository } from "./products/products.repository.ts";
import { ProductsService } from "./products/products.service.ts";
import type { ReviewsRepository } from "./reviews/reviews.repository.ts";
import { ReviewsService } from "./reviews/reviews.service.ts";
import { registerProblemHandler } from "./shared/problem.ts";
import { swaggerController } from "./swagger/swagger.controller.ts";
import type { UsersRepository } from "./users/users.repository.ts";
import { UsersService } from "./users/users.service.ts";
import type { VendorsRepository } from "./vendors/vendors.repository.ts";
import { VendorsService } from "./vendors/vendors.service.ts";
import { v1 } from "./v1.ts";

export type AppOptions = {
  logger: boolean;
  jwt: JwtEnv;
  usersRepository: UsersRepository;
  vendorsRepository: VendorsRepository;
  productsRepository: ProductsRepository;
  reviewsRepository: ReviewsRepository;
  imageStorage: ImageStorage;
  images: Pick<ImageEnv, "maxBytes" | "maxPerProduct">;
  ordersRepository: OrdersRepository;
  paymentGateway: PaymentGateway;
  cart: CartEnv;
  orders: OrdersEnv;
  clock: Clock;
  runOrderScheduler: boolean;
  checkDatabase: DatabaseCheck;
};

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger
      ? {
          redact: {
            paths: ["req.headers.authorization", "req.body.password", "req.body.cardNumber"],
            censor: "[redacted]",
          },
        }
      : false,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerProblemHandler(app);

  await app.register(fastifyMultipart, {
    limits: { fileSize: options.images.maxBytes, files: 1 },
  });

  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "Vendor Hub API", version: "0.0.0" },
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  const passwords = new Argon2PasswordService();
  const tokens = new TokenService(options.jwt);
  const usersService = new UsersService(options.usersRepository, passwords);
  const vendorsService = new VendorsService(options.vendorsRepository, options.usersRepository);
  const productsService = new ProductsService(
    options.productsRepository,
    options.vendorsRepository,
    options.imageStorage,
    options.images,
  );
  const reviewsService = new ReviewsService(
    options.reviewsRepository,
    options.productsRepository,
    options.vendorsRepository,
  );
  const authService = new AuthService(options.usersRepository, passwords, tokens);
  const cartService = new CartService(options.productsRepository, options.cart);
  const ordersService = new OrdersService(
    options.ordersRepository,
    options.vendorsRepository,
    cartService,
    options.paymentGateway,
    options.orders,
    options.clock,
  );

  if (options.runOrderScheduler) {
    registerOrderScheduler(app, ordersService, options.orders.schedulerIntervalSeconds);
  }

  await app.register(swaggerController);
  await app.register(healthController(options.checkDatabase));
  await app.register(
    v1({
      usersService,
      authService,
      vendorsService,
      productsService,
      reviewsService,
      cartService,
      ordersService,
      tokens,
    }),
    { prefix: "/api/v1" },
  );

  return app;
}
