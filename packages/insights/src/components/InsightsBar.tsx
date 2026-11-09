import type { InsightsVendorListResponse } from "@vendor-hub/types";
import { PeriodCurrencyBar } from "@vendor-hub/ui";

import { useT } from "../context/MessagesContext";
import { PERIODS, periodLabelKey, type Currency, type Period } from "../period";

type Meta = InsightsVendorListResponse["meta"];

type Props = {
  meta: Pick<Meta, "period" | "currency" | "currencies">;
  onChange: (patch: { period?: Period; currency?: Currency }) => void;
  fluid?: boolean;
};

export function InsightsBar({ meta, onChange, fluid }: Props) {
  const t = useT();

  return (
    <PeriodCurrencyBar
      fluid={fluid}
      periods={PERIODS.map((period) => ({ value: period, label: t(periodLabelKey(period)) }))}
      period={meta.period}
      periodLabel={t("bar.period")}
      onPeriodChange={(value) => onChange({ period: value as Period })}
      currencies={meta.currencies}
      currency={meta.currency}
      currencyLabel={t("bar.currency")}
      onCurrencyChange={(value) => onChange({ currency: value as Currency })}
    />
  );
}
