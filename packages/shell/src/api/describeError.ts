import { ApiError } from "./ApiError";

export type ErrorContext = "login" | "register" | "generic";

export type ErrorDescription = {
  form: string | null;
  fields: Record<string, string>;
};

export function describeError(error: unknown, context: ErrorContext): ErrorDescription {
  if (!(error instanceof ApiError)) {
    return { form: "auth.error.generic", fields: {} };
  }

  switch (error.kind) {
    case "network":
      return { form: "auth.error.network", fields: {} };
    case "server":
      return { form: "auth.error.server", fields: {} };
    case "unauthorized":
      return {
        form: context === "login" ? "auth.error.invalidCredentials" : "auth.error.sessionExpired",
        fields: {},
      };
    case "conflict":
      return context === "register"
        ? { form: null, fields: { email: "auth.error.emailTaken" } }
        : { form: error.detail || "auth.error.generic", fields: {} };
    case "validation":
      return Object.keys(error.fieldErrors).length > 0
        ? { form: null, fields: error.fieldErrors }
        : { form: error.detail || "auth.error.generic", fields: {} };
    case "client":
      return { form: error.detail || "auth.error.generic", fields: {} };
  }
}
