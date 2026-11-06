import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ProblemResponse } from "../shared/problem.ts";
import {
  CreateProductRequest,
  ProductCategoryCountListResponse,
  ProductCategoryCountsQuery,
  ProductIdParams,
  ProductImageParams,
  ProductImageResponse,
  ProductListResponse,
  ProductResponse,
  ReorderImagesRequest,
  SearchProductsQuery,
  UpdateProductRequest,
  VendorProductsParams,
} from "./products.schemas.ts";
import {
  toImageResponse,
  toProductListItemResponse,
  toProductResponse,
} from "./products.mapper.ts";
import type { ProductsService } from "./products.service.ts";
import { VendorSlugParams } from "../vendors/vendors.schemas.ts";
import { BadRequestError } from "../shared/errors.ts";
import { z } from "zod";

const security = [{ bearerAuth: [] }];
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

export function publicProductsController(service: ProductsService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.get(
      "/vendors/by-slug/:slug/products",
      {
        schema: {
          tags: ["products"],
          params: VendorSlugParams,
          querystring: SearchProductsQuery,
          response: { 200: ProductListResponse, 400: ProblemResponse, 404: ProblemResponse },
        },
      },
      async (request) => {
        const { items, total } = await service.search(request.params.slug, request.query);

        return {
          data: items.map(toProductListItemResponse),
          meta: { total, limit: request.query.limit, offset: request.query.offset },
        };
      },
    );

    typed.get(
      "/vendors/by-slug/:slug/product-categories",
      {
        schema: {
          tags: ["products"],
          params: VendorSlugParams,
          querystring: ProductCategoryCountsQuery,
          response: {
            200: ProductCategoryCountListResponse,
            400: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) => ({
        data: await service.categoryCounts(request.params.slug, request.query),
      }),
    );

    typed.get(
      "/products/:id",
      {
        schema: {
          tags: ["products"],
          params: ProductIdParams,
          response: { 200: ProductResponse, 400: ProblemResponse, 404: ProblemResponse },
        },
      },
      async (request) => toProductResponse(await service.get(request.params.id)),
    );

    typed.get(
      "/product-images/:id",
      {
        schema: {
          tags: ["products"],
          params: ProductIdParams,
          response: { 400: ProblemResponse, 404: ProblemResponse },
        },
      },
      async (request, reply) => {
        const { image, data } = await service.readImage(request.params.id);

        const plain: FastifyReply = reply;

        return plain.header("Cache-Control", IMMUTABLE_CACHE).type(image.contentType).send(data);
      },
    );
  };
}

export function productsController(service: ProductsService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.post(
      "/vendors/:id/products",
      {
        schema: {
          tags: ["products"],
          security,
          params: VendorProductsParams,
          body: CreateProductRequest,
          response: {
            201: ProductResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        const product = await service.create(request.auth, request.params.id, request.body);

        return reply.status(201).send(toProductResponse(product));
      },
    );

    typed.patch(
      "/products/:id",
      {
        schema: {
          tags: ["products"],
          security,
          params: ProductIdParams,
          body: UpdateProductRequest,
          response: {
            200: ProductResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) =>
        toProductResponse(await service.update(request.auth, request.params.id, request.body)),
    );

    typed.delete(
      "/products/:id",
      {
        schema: {
          tags: ["products"],
          security,
          params: ProductIdParams,
          response: {
            204: z.null(),
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        await service.delete(request.auth, request.params.id);

        return reply.status(204).send(null);
      },
    );

    typed.post(
      "/products/:id/images",
      {
        schema: {
          tags: ["products"],
          security,
          consumes: ["multipart/form-data"],
          params: ProductIdParams,
          response: {
            201: ProductImageResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
            409: ProblemResponse,
            413: ProblemResponse,
            415: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        const part = await request.file();

        if (part === undefined) {
          throw new BadRequestError("An image file is required");
        }

        const data = await part.toBuffer();
        const image = await service.addImage(request.auth, request.params.id, data);

        return reply.status(201).send(toImageResponse(image));
      },
    );

    typed.put(
      "/products/:id/images/order",
      {
        schema: {
          tags: ["products"],
          security,
          params: ProductIdParams,
          body: ReorderImagesRequest,
          response: {
            200: ProductResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) =>
        toProductResponse(
          await service.reorderImages(request.auth, request.params.id, request.body.imageIds),
        ),
    );

    typed.delete(
      "/products/:id/images/:imageId",
      {
        schema: {
          tags: ["products"],
          security,
          params: ProductImageParams,
          response: {
            204: z.null(),
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        await service.removeImage(request.auth, request.params.id, request.params.imageId);

        return reply.status(204).send(null);
      },
    );
  };
}
