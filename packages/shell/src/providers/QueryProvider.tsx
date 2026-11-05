import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { ApiError } from "../api/ApiError";
import { createBrowserClients, type BrowserClients } from "../api/apiClient";
import { queryKeys } from "../api/queryKeys";
import { loginPath } from "../auth/safeRedirect";

const UNAUTHORIZED_EVENT = "vendor-hub:unauthorized";
export const AUTH_MUTATION_SCOPE = "auth";
const STALE_TIME_MS = 60_000;
const MAX_NETWORK_RETRIES = 2;

const ClientsContext = createContext<BrowserClients | null>(null);

export function useBrowserClients(): BrowserClients {
  const clients = use(ClientsContext);

  if (!clients) {
    throw new Error("useBrowserClients must be used inside QueryProvider");
  }

  return clients;
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "unauthorized";
}

function createQueryClient(onUnauthorized: () => void): QueryClient {
  const handle = (error: unknown) => {
    if (isUnauthorized(error)) {
      onUnauthorized();
    }
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: handle }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.options.mutationKey?.[0] !== AUTH_MUTATION_SCOPE) {
          handle(error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: (failureCount, error) =>
          error instanceof ApiError &&
          error.kind === "network" &&
          failureCount < MAX_NETWORK_RETRIES,
      },
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ origin, children }: { origin: string; children: ReactNode }) {
  const navigate = useNavigate();

  const [clients] = useState(() => createBrowserClients(origin));
  const [queryClient] = useState(() =>
    createQueryClient(() => window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))),
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.setQueryData(queryKeys.session.current(), null);
      void navigate(loginPath(window.location.pathname + window.location.search));
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate, queryClient]);

  return (
    <ClientsContext value={clients}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ClientsContext>
  );
}
