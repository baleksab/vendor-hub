import { logoutAction } from "../auth/authActions.server";
import type { Route } from "./+types/logout";

export function action({ request }: Route.ActionArgs) {
  return logoutAction(request);
}
