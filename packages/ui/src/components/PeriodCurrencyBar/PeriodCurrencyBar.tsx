import { Group, Select } from "@mantine/core";

const SELECT_WIDTH = 170;
const CURRENCY_WIDTH = 120;

type Option = { value: string; label: string };

type Props = {
  periods: Option[];
  period: string;
  periodLabel: string;
  onPeriodChange: (period: string) => void;
  currencies: string[];
  currency: string;
  currencyLabel: string;
  onCurrencyChange: (currency: string) => void;
};

export function PeriodCurrencyBar({
  periods,
  period,
  periodLabel,
  onPeriodChange,
  currencies,
  currency,
  currencyLabel,
  onCurrencyChange,
}: Props) {
  return (
    <Group gap="sm" align="flex-end">
      <Select
        label={periodLabel}
        data={periods}
        value={period}
        onChange={(value) => value !== null && onPeriodChange(value)}
        allowDeselect={false}
        w={SELECT_WIDTH}
      />
      <Select
        label={currencyLabel}
        data={currencies}
        value={currency}
        onChange={(value) => value !== null && onCurrencyChange(value)}
        allowDeselect={false}
        disabled={currencies.length < 2}
        w={CURRENCY_WIDTH}
      />
    </Group>
  );
}
