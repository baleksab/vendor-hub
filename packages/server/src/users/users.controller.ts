import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ProblemResponse } from "../shared/problem.ts";
import { toUserResponse } from "./users.mapper.ts";
import {
  CreateUserRequest,
  ListUsersQuery,
  UpdateUserRequest,
  UserIdParams,
  UserListResponse,
  UserResponse,
} from "./users.schemas.ts";
import type { UsersService } from "./users.service.ts";

const security = [{ bearerAuth: [] }];

export function publicUsersController(service: UsersService) {
  return async (app: FastifyInstance): Promise<void> => {
    app.withTypeProvider<ZodTypeProvider>().post(
      "/users",
      {
        schema: {
          tags: ["users"],
          body: CreateUserRequest,
          response: { 201: UserResponse, 400: ProblemResponse, 409: ProblemResponse },
        },
      },
      async (request, reply) => {
        const user = await service.create(request.body);

        return reply
          .status(201)
          .header("Location", `/api/v1/users/${user.id}`)
          .send(toUserResponse(user));
      },
    );
  };
}

export function usersController(service: UsersService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.get(
      "/users",
      {
        schema: {
          tags: ["users"],
          security,
          querystring: ListUsersQuery,
          response: { 200: UserListResponse, 400: ProblemResponse, 401: ProblemResponse },
        },
      },
      async (request) => {
        const { items, total } = await service.list(request.query);

        return {
          data: items.map(toUserResponse),
          meta: { total, limit: request.query.limit, offset: request.query.offset },
        };
      },
    );

    typed.get(
      "/users/:id",
      {
        schema: {
          tags: ["users"],
          security,
          params: UserIdParams,
          response: {
            200: UserResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
          },
        },
      },
      async (request) => toUserResponse(await service.get(request.params.id)),
    );

    typed.patch(
      "/users/:id",
      {
        schema: {
          tags: ["users"],
          security,
          params: UserIdParams,
          body: UpdateUserRequest,
          response: {
            200: UserResponse,
            400: ProblemResponse,
            401: ProblemResponse,
            404: ProblemResponse,
            409: ProblemResponse,
          },
        },
      },
      async (request) => toUserResponse(await service.update(request.params.id, request.body)),
    );
  };
}
