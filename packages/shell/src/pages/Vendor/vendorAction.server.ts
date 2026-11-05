import { redirect } from "react-router";

import { addOperator, removeOperator } from "../../api/endpoints/vendors.server";
import { assertSameOrigin } from "../../auth/sameOrigin.server";
import { requireUser } from "../../auth/session.server";
import { failed, invalid, readValues } from "../../forms/formErrors.server";
import { addOperatorSchema, removeOperatorSchema } from "./vendorSchema";

const BAD_REQUEST = 400;

export async function vendorAction(request: Request) {
  assertSameOrigin(request);

  const session = await requireUser(request);
  const values = await readValues(request);

  if (values.intent === "add") {
    const operator = addOperatorSchema.safeParse(values);

    if (!operator.success) {
      return invalid(operator.error, values);
    }

    try {
      await addOperator(session.token, operator.data);
    } catch (error) {
      return failed(error, "addOperator", values);
    }

    return redirect("/vendor");
  }

  if (values.intent === "remove") {
    const operator = removeOperatorSchema.safeParse(values);

    if (!operator.success) {
      return invalid(operator.error, values);
    }

    try {
      await removeOperator(session.token, operator.data.userId);
    } catch (error) {
      return failed(error, "generic", values);
    }

    return redirect("/vendor");
  }

  throw new Response("Unknown intent", { status: BAD_REQUEST });
}
