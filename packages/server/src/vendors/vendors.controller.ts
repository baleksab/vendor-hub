import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { ProblemResponse } from "../shared/problem.ts";
import { toMyVendorsResponse, toPublicVendorResponse, toVendorResponse } from "./vendors.mapper.ts";
import {
  AddOperatorRequest,
  MyVendorsResponse,
  OperatorParams,
  PublicVendorResponse,
  RegisterVendorRequest,
  VendorResponse,
  VendorSlugParams,
} from "./vendors.schemas.ts";
import type { VendorsService } from "./vendors.service.ts";

const security = [{ bearerAuth: [] }];

export function publicVendorsController(service: VendorsService) {
  return async (app: FastifyInstance): Promise<void> => {
    app.withTypeProvider<ZodTypeProvider>().get(
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
  };
}
