import { ApiError } from "@vendor-hub/api-client";

export type ErrorContext = "login" | "register" | "vendor" | "review" | "generic";

export type ErrorDescription = {
  form: string | null;
  fields: Record<string, string>;
};

function describeConflict(error: ApiError, context: ErrorContext): ErrorDescription {
  switch (context) {
    case "register":
      return { form: null, fields: { email: "auth.error.emailTaken" } };
    case "vendor":
      return { form: null, fields: { slug: "vendor.error.slugTaken" } };
    default:
      return { form: error.detail || "auth.error.generic", fields: {} };
  }
}

export function describeError(error: unknown, context: ErrorContext): ErrorDescription {
  if (!(error instanceof ApiError)) {
    return { form: "auth.error.generic", fields: {} };
  }

  if (context === "review" && error.status === 403) {
    return { form: "review.error.ownVendor", fields: {} };
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
      return describeConflict(error, context);
    case "validation":
      return Object.keys(error.fieldErrors).length > 0
        ? { form: null, fields: error.fieldErrors }
        : { form: error.detail || "auth.error.generic", fields: {} };
    case "client":
      return { form: error.detail || "auth.error.generic", fields: {} };
  }
}
