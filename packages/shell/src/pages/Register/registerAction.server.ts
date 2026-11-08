import { redirect } from "react-router";

import { loadCountries } from "../../api/endpoints/countries.server";
import { createUser } from "../../api/endpoints/users.server";
import { assertSameOrigin } from "../../auth/sameOrigin.server";
import { redirectTarget } from "../../auth/safeRedirect";
import { signIn } from "../../auth/signIn.server";
import { failed, invalid, readValues } from "../../forms/formErrors.server";
import { createRegisterSchema, toCreateUserRequest } from "./registerSchema";

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
    await createUser(toCreateUserRequest(registration.data));
  } catch (error) {
    return failed(error, "register", values);
  }

  try {
    const { email, password } = registration.data;
    const headers = await signIn(request, { email, password });

    return redirect(redirectTarget(request), { headers });
  } catch {
    return redirect("/login?registered=1");
  }
}
