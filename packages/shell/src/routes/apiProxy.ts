import { forwardApiRequest } from "../proxy/forwardApiRequest.server";
import type { Route } from "./+types/apiProxy";

export function loader({ request }: Route.LoaderArgs) {
  return forwardApiRequest(request);
}

export function action({ request }: Route.ActionArgs) {
  return forwardApiRequest(request);
}
