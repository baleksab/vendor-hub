import { ProblemSchema } from "./problem";

export type ApiErrorKind =
  | "network"
  | "validation"
  | "unauthorized"
  | "conflict"
  | "server"
  | "client";

type ApiErrorInit = {
  status: number;
  kind: ApiErrorKind;
  title: string;
  detail: string;
  fieldErrors?: Record<string, string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly title: string;
  readonly detail: string;
  readonly fieldErrors: Record<string, string>;

  constructor(init: ApiErrorInit) {
    super(init.detail || init.title);
    this.name = "ApiError";
    this.status = init.status;
    this.kind = init.kind;
    this.title = init.title;
    this.detail = init.detail;
    this.fieldErrors = init.fieldErrors ?? {};
  }
}

function kindOf(status: number): ApiErrorKind {
  if (status === 400) {
    return "validation";
  }

  if (status === 401) {
    return "unauthorized";
  }

  if (status === 409) {
    return "conflict";
  }

  return status >= 500 ? "server" : "client";
}

function toFieldErrors(errors: { path: string; message: string }[] | undefined) {
  const fieldErrors: Record<string, string> = {};

  for (const { path, message } of errors ?? []) {
    fieldErrors[path] ??= message;
  }

  return fieldErrors;
}

export function networkError(cause: unknown): ApiError {
  const detail = cause instanceof Error ? cause.message : "Request failed";

  return new ApiError({ status: 0, kind: "network", title: "Network error", detail });
}

export function fromResponse(status: number, statusText: string, body: unknown): ApiError {
  const problem = ProblemSchema.safeParse(body);

  if (!problem.success) {
    return new ApiError({ status, kind: kindOf(status), title: statusText, detail: "" });
  }

  return new ApiError({
    status,
    kind: kindOf(status),
    title: problem.data.title,
    detail: problem.data.detail,
    fieldErrors: toFieldErrors(problem.data.errors),
  });
}
