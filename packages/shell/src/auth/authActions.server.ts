import { data, redirect } from "react-router";
import type { ZodError } from "zod";

import { ApiError, networkError } from "../api/ApiError";
import { loadCountries } from "../api/countries.server";
import { unwrap } from "../api/createApiClient";
import { createServerApi } from "../api/createServerApi.server";
import { describeError, type ErrorContext } from "../api/describeError";
import type { LoginRequest } from "../api/types";
import { assertSameOrigin } from "./sameOrigin.server";
import { safeRedirectTo } from "./safeRedirect";
import { createRegisterSchema, loginSchema, toCreateUserRequest } from "./schemas";
import { clearToken, commitToken } from "./sessionCookie.server";

export type FormErrors = {
  form: string | null;
  fields: Record<string, string>;
  values: Record<string, string>;
};

const SECRET_FIELDS = new Set(["password", "confirmPassword"]);
const BAD_REQUEST = 400;
const BAD_GATEWAY = 502;

async function readValues(request: Request): Promise<Record<string, string>> {
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

function invalid(error: ZodError, values: Record<string, string>) {
  const errors: FormErrors = {
    form: null,
    fields: issueFields(error),
    values: publicValues(values),
  };

  return data(errors, { status: BAD_REQUEST });
}

function failed(error: unknown, context: ErrorContext, values: Record<string, string>) {
  const apiError = error instanceof ApiError ? error : networkError(error);
  const { form, fields } = describeError(apiError, context);
  const errors: FormErrors = { form, fields, values: publicValues(values) };

  return data(errors, { status: apiError.status === 0 ? BAD_GATEWAY : apiError.status });
}

function redirectTarget(request: Request): string {
  return safeRedirectTo(new URL(request.url).searchParams.get("redirectTo"));
}

async function signIn(credentials: LoginRequest): Promise<string> {
  const token = await unwrap(createServerApi().POST("/api/v1/auth", { body: credentials }));

  return commitToken(token.accessToken, token.expiresIn);
}

export async function loginAction(request: Request) {
  assertSameOrigin(request);

  const values = await readValues(request);
  const credentials = loginSchema.safeParse(values);

  if (!credentials.success) {
    return invalid(credentials.error, values);
  }

  try {
    const cookie = await signIn(credentials.data);

    return redirect(redirectTarget(request), { headers: { "Set-Cookie": cookie } });
  } catch (error) {
    return failed(error, "login", values);
  }
}

export async function registerAction(request: Request) {
  assertSameOrigin(request);

  const values = await readValues(request);
  let countries: string[];

  try {
    countries = await loadCountries();
  } catch (error) {
    return failed(error, "register", values);
  }

  const registration = createRegisterSchema(countries).safeParse(values);

  if (!registration.success) {
    return invalid(registration.error, values);
  }

  try {
    await unwrap(
      createServerApi().POST("/api/v1/users", { body: toCreateUserRequest(registration.data) }),
    );
  } catch (error) {
    return failed(error, "register", values);
  }

  try {
    const { email, password } = registration.data;
    const cookie = await signIn({ email, password });

    return redirect(redirectTarget(request), { headers: { "Set-Cookie": cookie } });
  } catch {
    return redirect("/login?registered=1");
  }
}

export async function logoutAction(request: Request) {
  assertSameOrigin(request);

  return redirect("/", { headers: { "Set-Cookie": await clearToken() } });
}
