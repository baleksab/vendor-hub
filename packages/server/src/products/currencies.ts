export const CURRENCIES = ["EUR", "RSD", "USD"] as const;

export type Currency = (typeof CURRENCIES)[number];
