import { createContext, use } from "react";

import type { T } from "../i18n/messages";

export const MessagesContext = createContext<T | null>(null);

export function useT(): T {
  const t = use(MessagesContext);

  if (!t) {
    throw new Error("useT must be used inside Insights");
  }

  return t;
}
