import type { FastifyError, FastifyInstance } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import { z } from "zod";

import { AppError } from "./errors.ts";

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

export const ProblemResponse = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    instance: z.string(),
    errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  })
  .meta({ id: "ProblemResponse" });

export type ProblemResponse = z.infer<typeof ProblemResponse>;

const TITLES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

function isClientError(error: unknown): error is FastifyError & { statusCode: number } {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  );
}

function toPath(instancePath: string): string {
  return instancePath.replace(/^\//, "").replaceAll("/", ".");
}

export function registerProblemHandler(app: FastifyInstance): void {
  app.setNotFoundHandler(async (request, reply) => {
    const problem: ProblemResponse = {
      type: "about:blank",
      title: TITLES[404],
      status: 404,
      detail: `Route ${request.method} ${request.url} not found`,
      instance: request.url,
    };

    return reply.status(404).type(PROBLEM_CONTENT_TYPE).send(problem);
  });

  app.setErrorHandler(async (error, request, reply) => {
    let problem: ProblemResponse;

    if (error instanceof AppError) {
      problem = {
        type: "about:blank",
        title: error.title,
        status: error.status,
        detail: error.message,
        instance: request.url,
      };
    } else if (hasZodFastifySchemaValidationErrors(error)) {
      problem = {
        type: "about:blank",
        title: TITLES[400],
        status: 400,
        detail: "Request validation failed",
        instance: request.url,
        errors: error.validation.map((issue) => ({
          path: toPath(issue.instancePath),
          message: issue.message ?? "Invalid value",
        })),
      };
    } else if (isClientError(error)) {
      problem = {
        type: "about:blank",
        title: TITLES[error.statusCode] ?? "Bad Request",
        status: error.statusCode,
        detail: error.message,
        instance: request.url,
      };
    } else {
      request.log.error(error);
      problem = {
        type: "about:blank",
        title: TITLES[500],
        status: 500,
        detail: "Unexpected server error",
        instance: request.url,
      };
    }

    return reply.status(problem.status).type(PROBLEM_CONTENT_TYPE).send(problem);
  });
}
