import { z } from "zod";

export const INSIGHT_PERIODS = ["7d", "30d", "90d", "12m", "all"] as const;

export const InsightPeriodSchema = z.enum(INSIGHT_PERIODS);

export type InsightPeriod = (typeof INSIGHT_PERIODS)[number];

export const BUCKET_UNITS = ["day", "week", "month"] as const;

export type BucketUnit = (typeof BUCKET_UNITS)[number];

export type InsightWindow = { from: Date | null; to: Date };

export type PeriodWindows = {
  current: InsightWindow;
  previous: InsightWindow | null;
  unit: BucketUnit;
};

const DAY_MS = 86_400_000;
const DAY_BUCKET_MAX_DAYS = 31;
const WEEK_BUCKET_MAX_DAYS = 190;
const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;
const YEAR_MONTHS = 12;

function monthsBefore(date: Date, months: number): Date {
  const result = new Date(date);

  result.setUTCMonth(result.getUTCMonth() - months);

  return result;
}

function unitFor(from: Date | null, to: Date): BucketUnit {
  if (from === null) {
    return "month";
  }

  const days = (to.getTime() - from.getTime()) / DAY_MS;

  if (days <= DAY_BUCKET_MAX_DAYS) {
    return "day";
  }

  return days <= WEEK_BUCKET_MAX_DAYS ? "week" : "month";
}

export function resolveWindows(period: InsightPeriod, now: Date): PeriodWindows {
  if (period === "all") {
    return { current: { from: null, to: now }, previous: null, unit: "month" };
  }

  const from =
    period === "12m"
      ? monthsBefore(now, YEAR_MONTHS)
      : new Date(now.getTime() - PERIOD_DAYS[period] * DAY_MS);
  const previousFrom =
    period === "12m"
      ? monthsBefore(from, YEAR_MONTHS)
      : new Date(from.getTime() - PERIOD_DAYS[period] * DAY_MS);

  return {
    current: { from, to: now },
    previous: { from: previousFrom, to: from },
    unit: unitFor(from, now),
  };
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function truncate(date: Date, unit: BucketUnit): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (unit === "day") {
    return day;
  }

  if (unit === "month") {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  const sinceMonday = (day.getUTCDay() + 6) % 7;

  return new Date(day.getTime() - sinceMonday * DAY_MS);
}

function advance(date: Date, unit: BucketUnit): Date {
  if (unit === "day") {
    return new Date(date.getTime() + DAY_MS);
  }

  if (unit === "week") {
    return new Date(date.getTime() + 7 * DAY_MS);
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export function bucketKeys(from: Date, to: Date, unit: BucketUnit): string[] {
  const keys: string[] = [];
  const last = truncate(to, unit).getTime();

  for (
    let cursor = truncate(from, unit);
    cursor.getTime() <= last;
    cursor = advance(cursor, unit)
  ) {
    keys.push(toKey(cursor));
  }

  return keys;
}

export function firstBucket(dates: string[]): Date | null {
  const [first] = [...dates].sort();

  return first === undefined ? null : new Date(`${first}T00:00:00.000Z`);
}
