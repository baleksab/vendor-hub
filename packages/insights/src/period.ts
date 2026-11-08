import type { InsightsDetailQuery } from "@vendor-hub/types";

import type { MessageKey } from "./i18n/messages";

export type Period = NonNullable<InsightsDetailQuery["period"]>;

export type Currency = NonNullable<InsightsDetailQuery["currency"]>;

export const PERIODS: readonly Period[] = ["7d", "30d", "90d", "12m", "all"];

export const DEFAULT_PERIOD: Period = "30d";

export const periodLabelKey = (period: Period): MessageKey => `period.${period}`;

export function readPeriod(raw: string | null): Period {
  return PERIODS.find((candidate) => candidate === raw) ?? DEFAULT_PERIOD;
}

export function readCurrency(raw: string | null): Currency | undefined {
  return raw === "EUR" || raw === "RSD" || raw === "USD" ? raw : undefined;
}
