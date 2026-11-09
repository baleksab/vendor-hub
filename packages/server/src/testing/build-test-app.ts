import type { FastifyInstance } from "fastify";

import type { CartEnv, JwtEnv, OrdersEnv } from "../../env.ts";
import { buildApp } from "../app.ts";
import { CartService } from "../cart/cart.service.ts";
import { InMemoryInsightsRepository } from "./in-memory-insights.repository.ts";
import { OrdersService } from "../orders/orders.service.ts";
import { SimulatedPaymentGateway } from "../payments/simulated-payment-gateway.ts";
import { InMemoryOrdersRepository } from "./in-memory-orders.repository.ts";
import { InMemoryUsersRepository } from "./in-memory-users.repository.ts";
import { InMemoryImageStorage } from "./in-memory-image-storage.ts";
import { InMemoryProductsRepository } from "./in-memory-products.repository.ts";
import { InMemoryReviewsRepository } from "./in-memory-reviews.repository.ts";
import { InMemoryVendorsRepository } from "./in-memory-vendors.repository.ts";

export const TEST_JWT: JwtEnv = {
  secret: "test-secret-test-secret-test-secret-123",
  expiresInSeconds: 3600,
};

export const TEST_IMAGES = { maxBytes: 1024, maxPerProduct: 2 };

export const TEST_CART: CartEnv = { maxLines: 5 };

export const TEST_ORDERS: OrdersEnv = {
  paymentTtlMinutes: 30,
  paymentMaxAttempts: 3,
  returnWindowDays: 14,
  schedulerIntervalSeconds: 60,
  schedulerBatchSize: 10,
};

export class TestClock {
  current = new Date("2026-01-01T12:00:00.000Z");

  now = () => new Date(this.current);

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export type TestApp = {
  app: FastifyInstance;
  repository: InMemoryUsersRepository;
  vendorsRepository: InMemoryVendorsRepository;
  productsRepository: InMemoryProductsRepository;
  reviewsRepository: InMemoryReviewsRepository;
  imageStorage: InMemoryImageStorage;
  ordersRepository: InMemoryOrdersRepository;
  insightsRepository: InMemoryInsightsRepository;
  ordersService: OrdersService;
  clock: TestClock;
};

export async function buildTestApp(
  checkDatabase: () => Promise<void> = async () => {},
): Promise<TestApp> {
  const repository = new InMemoryUsersRepository();
  const vendorsRepository = new InMemoryVendorsRepository(repository);
  const productsRepository = new InMemoryProductsRepository(vendorsRepository);
  vendorsRepository.productCategoriesOf = (vendorId) =>
    productsRepository.rows.filter((row) => row.vendorId === vendorId).map((row) => row.category);

  const reviewsRepository = new InMemoryReviewsRepository(
    repository,
    productsRepository,
    vendorsRepository,
  );
  const imageStorage = new InMemoryImageStorage();
  const clock = new TestClock();
  const ordersRepository = new InMemoryOrdersRepository(
    productsRepository,
    vendorsRepository,
    clock.now,
  );
  const insightsRepository = new InMemoryInsightsRepository(vendorsRepository);
  const app = await buildApp({
    logger: false,
    jwt: TEST_JWT,
    usersRepository: repository,
    vendorsRepository,
    productsRepository,
    reviewsRepository,
    imageStorage,
    images: TEST_IMAGES,
    ordersRepository,
    insightsRepository,
    paymentGateway: new SimulatedPaymentGateway(),
    cart: TEST_CART,
    orders: TEST_ORDERS,
    clock: clock.now,
    runOrderScheduler: false,
    checkDatabase,
  });

  await app.ready();

  const ordersService = new OrdersService(
    ordersRepository,
    vendorsRepository,
    new CartService(productsRepository, TEST_CART),
    new SimulatedPaymentGateway(),
    TEST_ORDERS,
    clock.now,
  );

  return {
    app,
    repository,
    vendorsRepository,
    productsRepository,
    reviewsRepository,
    imageStorage,
    ordersRepository,
    insightsRepository,
    ordersService,
    clock,
  };
}

export const validUser = {
  email: "Jane@Example.com",
  password: "correct-horse-battery",
  firstName: "Jane",
  lastName: "Doe",
  address: "Main street 1",
  phoneNumber: "+381601234567",
  country: "RS",
};
