import { useRouteLoaderData } from "react-router";

import type { loader } from "../../root";

export function useSession() {
  const rootData = useRouteLoaderData<typeof loader>("root");

  return { user: rootData?.user ?? null, vendors: rootData?.vendors ?? null };
}
