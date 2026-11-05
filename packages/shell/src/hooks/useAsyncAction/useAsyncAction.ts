import { useState } from "react";

import { ApiError } from "../../api/ApiError";
import { loginPath } from "../../auth/safeRedirect";

type Options<Result> = {
  onSuccess?: (result: Result) => void;
  redirectOnUnauthorized?: boolean;
};

type State = { isPending: boolean; error: unknown };

export function useAsyncAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
  { onSuccess, redirectOnUnauthorized = true }: Options<Result> = {},
) {
  const [state, setState] = useState<State>({ isPending: false, error: null });

  const run = async (...args: Args): Promise<void> => {
    setState({ isPending: true, error: null });

    try {
      onSuccess?.(await action(...args));
    } catch (error) {
      if (redirectOnUnauthorized && error instanceof ApiError && error.kind === "unauthorized") {
        window.location.assign(loginPath(window.location.pathname + window.location.search));

        return;
      }

      setState({ isPending: false, error });
    }
  };

  return { run, isPending: state.isPending, error: state.error };
}
