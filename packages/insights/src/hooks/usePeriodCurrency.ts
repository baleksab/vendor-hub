import { useSearchParams } from "react-router";

import { DEFAULT_PERIOD, readCurrency, readPeriod, type Currency, type Period } from "../period";

type Patch = { period?: Period; currency?: Currency };

export function usePeriodCurrency() {
  const [searchParams, setSearchParams] = useSearchParams();
  const period = readPeriod(searchParams.get("period"));
  const currency = readCurrency(searchParams.get("currency"));

  const update = (patch: Patch) => {
    const next = new URLSearchParams();
    const nextPeriod = patch.period ?? period;
    const nextCurrency = patch.currency ?? currency;

    if (nextPeriod !== DEFAULT_PERIOD) {
      next.set("period", nextPeriod);
    }

    if (nextCurrency !== undefined) {
      next.set("currency", nextCurrency);
    }

    setSearchParams(next, { replace: true });
  };

  return { period, currency, update };
}
