import { redirect } from "react-router";

import { assertSameOrigin } from "../../auth/sameOrigin.server";
import { redirectTarget } from "../../auth/safeRedirect";
import { signIn } from "../../auth/signIn.server";
import { failed, invalid, readValues } from "../../forms/formErrors.server";
import { loginSchema } from "./loginSchema";

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
