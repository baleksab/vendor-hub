import type { AxiosInstance } from "axios";

import { createClient } from "./createClient";

export type BrowserClients = {
  api: AxiosInstance;
  auth: AxiosInstance;
};

export function createBrowserClients(origin: string): BrowserClients {
  return {
    api: createClient({ baseURL: `${origin}/api` }),
    auth: createClient({ baseURL: `${origin}/auth` }),
  };
}
