import type { FastifyInstance } from "fastify";

import type { JwtEnv } from "../../env.ts";
import { buildApp } from "../app.ts";
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

export type TestApp = {
  app: FastifyInstance;
  repository: InMemoryUsersRepository;
  vendorsRepository: InMemoryVendorsRepository;
  productsRepository: InMemoryProductsRepository;
  reviewsRepository: InMemoryReviewsRepository;
  imageStorage: InMemoryImageStorage;
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
  const app = await buildApp({
    logger: false,
    jwt: TEST_JWT,
    usersRepository: repository,
    vendorsRepository,
    productsRepository,
    reviewsRepository,
    imageStorage,
    images: TEST_IMAGES,
    checkDatabase,
  });

  await app.ready();

  return {
    app,
    repository,
    vendorsRepository,
    productsRepository,
    reviewsRepository,
    imageStorage,
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
