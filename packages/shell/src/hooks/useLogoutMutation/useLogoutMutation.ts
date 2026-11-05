import { useBrowserClients } from "../../api/useBrowserClients";
import { useAsyncAction } from "../useAsyncAction/useAsyncAction";

export function useLogoutMutation() {
  const { auth } = useBrowserClients();

  return useAsyncAction(() => auth.post("/logout", {}), {
    redirectOnUnauthorized: false,
    onSuccess: () => window.location.assign("/"),
  });
}
