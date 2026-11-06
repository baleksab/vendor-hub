import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ProblemResponse } from "../shared/problem.ts";
import { toOrderResponse, toOrderSummaryResponse, type OrderView } from "./orders.mapper.ts";
import {
  CartConflictProblem,
  CreateOrdersRequest,
  CreateOrdersResponse,
  OrderIdParams,
  OrderListQuery,
  OrderListResponse,
  OrderReasonRequest,
  OrderResponse,
  PaymentOutcomeResponse,
  PayOrderRequest,
  VendorOrdersParams,
} from "./orders.schemas.ts";
import type { OrdersService } from "./orders.service.ts";

const security = [{ bearerAuth: [] }];

const actionResponses = {
  200: OrderResponse,
  400: ProblemResponse,
  401: ProblemResponse,
  404: ProblemResponse,
  409: ProblemResponse,
};

export function ordersController(service: OrdersService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();
    const respond = (view: OrderView) => toOrderResponse(view, service.now(), service.rules);

    typed.post(
      "/orders",
      {
        schema: {
          tags: ["orders"],
          security,
          body: CreateOrdersRequest,
          response: {
            200: CreateOrdersResponse,
            201: CreateOrdersResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            409: CartConflictProblem,
          },
        },
      },
      async (request, reply) => {
        const { orders, replayed } = await service.create(request.auth, request.body);

        return reply
          .status(replayed ? 200 : 201)
          .send({ data: orders.map(toOrderSummaryResponse) });
      },
    );

    typed.get(
      "/orders",
      {
        schema: {
          tags: ["orders"],
          security,
          querystring: OrderListQuery,
          response: { 200: OrderListResponse, 400: ProblemResponse, 401: ProblemResponse },
        },
      },
      async (request) => {
        const { items, total } = await service.listMine(request.auth, request.query);

        return {
          data: items.map(toOrderSummaryResponse),
          meta: { total, limit: request.query.limit, offset: request.query.offset },
        };
      },
    );

    typed.get(
      "/vendors/:id/orders",
      {
        schema: {
          tags: ["orders"],
          security,
          params: VendorOrdersParams,
          querystring: OrderListQuery,
          response: {
            200: OrderListResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) => {
        const { items, total } = await service.listForVendor(
          request.auth,
          request.params.id,
          request.query,
        );

        return {
          data: items.map(toOrderSummaryResponse),
          meta: { total, limit: request.query.limit, offset: request.query.offset },
        };
      },
    );

    typed.get(
      "/orders/:id",
      {
        schema: {
          tags: ["orders"],
          security,
          params: OrderIdParams,
          response: {
            200: OrderResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) => respond(await service.get(request.auth, request.params.id)),
    );

    typed.post(
      "/orders/:id/payments",
      {
        schema: {
          tags: ["orders"],
          security,
          params: OrderIdParams,
          body: PayOrderRequest,
          response: { ...actionResponses, 200: PaymentOutcomeResponse },
        },
      },
      async (request) => {
        const result = await service.pay(request.auth, request.params.id, request.body.cardNumber);

        return {
          order: respond(result.view),
          payment: {
            status: result.status,
            failureReason: result.failureReason,
            attemptsLeft: result.attemptsLeft,
          },
        };
      },
    );

    typed.post(
      "/orders/:id/cancel",
      { schema: { tags: ["orders"], security, params: OrderIdParams, response: actionResponses } },
      async (request) => respond(await service.cancel(request.auth, request.params.id)),
    );

    typed.post(
      "/orders/:id/confirm-receipt",
      { schema: { tags: ["orders"], security, params: OrderIdParams, response: actionResponses } },
      async (request) => respond(await service.confirmReceipt(request.auth, request.params.id)),
    );

    typed.post(
      "/orders/:id/return-requests",
      {
        schema: {
          tags: ["orders"],
          security,
          params: OrderIdParams,
          body: OrderReasonRequest,
          response: actionResponses,
        },
      },
      async (request) =>
        respond(await service.requestReturn(request.auth, request.params.id, request.body.reason)),
    );

    typed.post(
      "/orders/:id/deliver",
      { schema: { tags: ["orders"], security, params: OrderIdParams, response: actionResponses } },
      async (request) => respond(await service.deliver(request.auth, request.params.id)),
    );

    typed.post(
      "/orders/:id/returns/approve",
      { schema: { tags: ["orders"], security, params: OrderIdParams, response: actionResponses } },
      async (request) => respond(await service.approveReturn(request.auth, request.params.id)),
    );

    typed.post(
      "/orders/:id/returns/reject",
      {
        schema: {
          tags: ["orders"],
          security,
          params: OrderIdParams,
          body: OrderReasonRequest,
          response: actionResponses,
        },
      },
      async (request) =>
        respond(await service.rejectReturn(request.auth, request.params.id, request.body.reason)),
    );
  };
}
