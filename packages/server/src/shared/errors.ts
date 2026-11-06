export class AppError extends Error {
  readonly status: number;
  readonly title: string;
  readonly extensions: Record<string, unknown>;

  constructor(
    status: number,
    title: string,
    detail: string,
    extensions: Record<string, unknown> = {},
  ) {
    super(detail);
    this.name = new.target.name;
    this.status = status;
    this.title = title;
    this.extensions = extensions;
  }
}

export class NotFoundError extends AppError {
  constructor(detail: string) {
    super(404, "Not Found", detail);
  }
}

export class ForbiddenError extends AppError {
  constructor(detail: string = "Forbidden") {
    super(403, "Forbidden", detail);
  }
}

export class ConflictError extends AppError {
  constructor(detail: string, extensions: Record<string, unknown> = {}) {
    super(409, "Conflict", detail, extensions);
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail: string) {
    super(401, "Unauthorized", detail);
  }
}

export class BadRequestError extends AppError {
  constructor(detail: string) {
    super(400, "Bad Request", detail);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(detail: string) {
    super(503, "Service Unavailable", detail);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(detail: string) {
    super(413, "Payload Too Large", detail);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(detail: string) {
    super(415, "Unsupported Media Type", detail);
  }
}
