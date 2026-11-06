import type { DatabaseHandle } from "../db/client.ts";
import type { AppOptions } from "../app.ts";
import { DrizzleOrdersRepository } from "../orders/orders.repository.ts";
import { SimulatedPaymentGateway } from "../payments/simulated-payment-gateway.ts";
import { DrizzleProductsRepository } from "../products/products.repository.ts";
import { DrizzleReviewsRepository } from "../reviews/reviews.repository.ts";
import { DrizzleUsersRepository } from "../users/users.repository.ts";
import { DrizzleVendorsRepository } from "../vendors/vendors.repository.ts";
import { TEST_CART, TEST_IMAGES, TEST_JWT, TEST_ORDERS } from "./build-test-app.ts";
import { InMemoryImageStorage } from "./in-memory-image-storage.ts";

export function drizzleAppOptions(handle: DatabaseHandle): AppOptions {
  return {
    logger: false,
    jwt: TEST_JWT,
    usersRepository: new DrizzleUsersRepository(handle.db),
    vendorsRepository: new DrizzleVendorsRepository(handle.db),
    productsRepository: new DrizzleProductsRepository(handle.db),
    reviewsRepository: new DrizzleReviewsRepository(handle.db),
    imageStorage: new InMemoryImageStorage(),
    images: TEST_IMAGES,
    ordersRepository: new DrizzleOrdersRepository(handle.db),
    paymentGateway: new SimulatedPaymentGateway(),
    cart: TEST_CART,
    orders: TEST_ORDERS,
    clock: () => new Date(),
    runOrderScheduler: false,
    checkDatabase: async () => {
      await handle.pool.query("select 1");
    },
  };
}
