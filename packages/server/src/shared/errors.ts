export class AppError extends Error {
  readonly status: number;
  readonly title: string;

  constructor(status: number, title: string, detail: string) {
    super(detail);
    this.name = new.target.name;
    this.status = status;
    this.title = title;
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
  constructor(detail: string) {
    super(409, "Conflict", detail);
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
