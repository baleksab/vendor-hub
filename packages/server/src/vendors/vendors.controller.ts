import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { ProblemResponse } from "../shared/problem.ts";
import {
  toManagedVendorListResponse,
  toMyVendorsResponse,
  toPublicVendorResponse,
  toVendorResponse,
} from "./vendors.mapper.ts";
import {
  AddOperatorRequest,
  ListManagedVendorsQuery,
  ListVendorsQuery,
  ManagedVendorListResponse,
  MyVendorsResponse,
  OperatorParams,
  PublicVendorResponse,
  RegisterVendorRequest,
  UpdateVendorRequest,
  VendorIdParams,
  VendorListResponse,
  VendorOperatorParams,
  VendorResponse,
  VendorSlugParams,
} from "./vendors.schemas.ts";
import type { VendorsService } from "./vendors.service.ts";

const security = [{ bearerAuth: [] }];

export function publicVendorsController(service: VendorsService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.get(
      "/vendors",
      {
        schema: {
          tags: ["vendors"],
          querystring: ListVendorsQuery,
          response: { 200: VendorListResponse, 400: ProblemResponse },
        },
      },
      async (request) => {
        const { items, total } = await service.list(request.query);

        return {
          data: items,
          meta: { total, limit: request.query.limit, offset: request.query.offset },
        };
      },
    );

    typed.get(
      "/vendors/by-slug/:slug",
      {
        schema: {
          tags: ["vendors"],
          params: VendorSlugParams,
          response: { 200: PublicVendorResponse, 400: ProblemResponse, 404: ProblemResponse },
        },
      },
      async (request) => toPublicVendorResponse(await service.getBySlug(request.params.slug)),
    );
  };
}

export function vendorsController(service: VendorsService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.post(
      "/vendors",
      {
        schema: {
          tags: ["vendors"],
          security,
          body: RegisterVendorRequest,
          response: {
            201: VendorResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            409: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        const vendor = await service.register(request.auth.userId, request.body);

        return reply.status(201).send(toVendorResponse(vendor));
      },
    );

    typed.get(
      "/vendors/me",
      {
        schema: {
          tags: ["vendors"],
          security,
          response: { 200: MyVendorsResponse, 401: ProblemResponse },
        },
      },
      async (request) => {
        const { owned, operating } = await service.getMine(request.auth.userId);

        return toMyVendorsResponse(owned, operating);
      },
    );

    typed.post(
      "/vendors/me/operators",
      {
        schema: {
          tags: ["vendors"],
          security,
          body: AddOperatorRequest,
          response: {
            201: VendorResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
            409: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        const vendor = await service.addOperator(request.auth.userId, request.body);

        return reply.status(201).send(toVendorResponse(vendor));
      },
    );

    typed.delete(
      "/vendors/me/operators/:userId",
      {
        schema: {
          tags: ["vendors"],
          security,
          params: OperatorParams,
          response: {
            204: z.null(),
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        await service.removeOperator(request.auth.userId, request.params.userId);

        return reply.status(204).send(null);
      },
    );

    typed.get(
      "/vendors/managed",
      {
        schema: {
          tags: ["vendors"],
          security,
          querystring: ListManagedVendorsQuery,
          response: { 200: ManagedVendorListResponse, 400: ProblemResponse, 401: ProblemResponse },
        },
      },
      async (request) => {
        const { items, total } = await service.listManaged(request.auth, request.query);

        return toManagedVendorListResponse(
          items,
          total,
          request.query,
          request.auth.role === "administrator" ? "all" : "mine",
        );
      },
    );

    typed.get(
      "/vendors/:id",
      {
        schema: {
          tags: ["vendors"],
          security,
          params: VendorIdParams,
          response: {
            200: VendorResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) => {
        const { vendor, access } = await service.getManaged(request.auth, request.params.id);

        return toVendorResponse(vendor, access);
      },
    );

    typed.patch(
      "/vendors/:id",
      {
        schema: {
          tags: ["vendors"],
          security,
          params: VendorIdParams,
          body: UpdateVendorRequest,
          response: {
            200: VendorResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) => {
        const { vendor, access } = await service.update(
          request.auth,
          request.params.id,
          request.body,
        );

        return toVendorResponse(vendor, access);
      },
    );

    typed.delete(
      "/vendors/:id",
      {
        schema: {
          tags: ["vendors"],
          security,
          params: VendorIdParams,
          response: {
            204: z.null(),
            400: ProblemResponse,
            401: ProblemResponse,
            403: ProblemResponse,
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
      "/vendors/:id/operators",
      {
        schema: {
          tags: ["vendors"],
          security,
          params: VendorIdParams,
          body: AddOperatorRequest,
          response: {
            201: VendorResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
            409: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        const { vendor, access } = await service.addOperatorTo(
          request.auth,
          request.params.id,
          request.body,
        );

        return reply.status(201).send(toVendorResponse(vendor, access));
      },
    );

    typed.delete(
      "/vendors/:id/operators/:userId",
      {
        schema: {
          tags: ["vendors"],
          security,
          params: VendorOperatorParams,
          response: {
            204: z.null(),
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request, reply) => {
        await service.removeOperatorFrom(request.auth, request.params.id, request.params.userId);

        return reply.status(204).send(null);
      },
    );
  };
}
