import { ApiError } from "../api/ApiError";
import { createServerApi } from "../api/createServerApi.server";
import { problemResponse } from "../api/problemResponse.server";
import type { TokenResponse, UserResponse } from "../api/types";
import { loginSchema } from "../auth/schemas";
import { assertSameOrigin } from "../auth/sameOrigin.server";
import { commitToken } from "../auth/sessionCookie.server";
import type { Route } from "./+types/auth.login";

const BAD_REQUEST = 400;

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);

  const body: unknown = await request.json().catch(() => null);
  const credentials = loginSchema.safeParse(body);

  if (!credentials.success) {
    return problemResponse(
      new ApiError({
        status: BAD_REQUEST,
        kind: "validation",
        title: "Bad Request",
        detail: "Request validation failed",
        fieldErrors: Object.fromEntries(
          credentials.error.issues.map((issue) => [issue.path.join("."), issue.message]),
        ),
      }),
    );
  }

  try {
    const { data: token } = await createServerApi().post<TokenResponse>("/auth", credentials.data);
    const { data: user } = await createServerApi(token.accessToken).get<UserResponse>("/users/me");

    return Response.json(user, {
      headers: { "Set-Cookie": await commitToken(token.accessToken, token.expiresIn) },
    });
  } catch (error) {
    return problemResponse(
      error instanceof ApiError
        ? error
        : new ApiError({
            status: 0,
            kind: "network",
            title: "Network error",
            detail: "Request failed",
          }),
    );
  }
}
