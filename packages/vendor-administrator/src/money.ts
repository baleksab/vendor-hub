import type { CreateProductRequest } from "@vendor-hub/types";

export const MINOR_UNITS_PER_MAJOR = 100;

export const CURRENCIES = [
  "EUR",
  "RSD",
  "USD",
] as const satisfies readonly CreateProductRequest["currency"][];

export const toMinor = (major: number) => Math.round(major * MINOR_UNITS_PER_MAJOR);

export const toMajor = (minor: number) => minor / MINOR_UNITS_PER_MAJOR;
