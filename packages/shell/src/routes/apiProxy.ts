import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { forwardApiRequest } from "../proxy/forwardApiRequest.server";

export function loader({ request }: LoaderFunctionArgs) {
  return forwardApiRequest(request);
}

export function action({ request }: ActionFunctionArgs) {
  return forwardApiRequest(request);
}
