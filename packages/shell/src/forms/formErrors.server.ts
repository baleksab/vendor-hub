import { data } from "react-router";
import type { ZodError } from "zod";

import { ApiError, networkError } from "../api/ApiError";
import { describeError, type ErrorContext } from "./describeError";

export type FormErrors = {
  form: string | null;
  fields: Record<string, string>;
  values: Record<string, string>;
};

const SECRET_FIELDS = new Set(["password", "confirmPassword"]);
const BAD_REQUEST = 400;
const BAD_GATEWAY = 502;

export async function readValues(request: Request): Promise<Record<string, string>> {
  const values: Record<string, string> = {};

  for (const [key, value] of await request.formData()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

function publicValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([key]) => !SECRET_FIELDS.has(key)));
}

function issueFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    fields[issue.path.join(".")] ??= issue.message;
  }

  return fields;
}

export function invalid(error: ZodError, values: Record<string, string>) {
  const errors: FormErrors = {
    form: null,
    fields: issueFields(error),
    values: publicValues(values),
  };

  return data(errors, { status: BAD_REQUEST });
}

export function failed(error: unknown, context: ErrorContext, values: Record<string, string>) {
  const apiError = error instanceof ApiError ? error : networkError(error);
  const { form, fields } = describeError(apiError, context);
  const errors: FormErrors = { form, fields, values: publicValues(values) };

  return data(errors, { status: apiError.status === 0 ? BAD_GATEWAY : apiError.status });
}
