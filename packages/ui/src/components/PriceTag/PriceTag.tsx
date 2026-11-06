import { Text, type TextProps } from "@mantine/core";

const MINOR_UNITS_PER_MAJOR = 100;

export function formatPrice(priceMinor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    priceMinor / MINOR_UNITS_PER_MAJOR,
  );
}

type Props = TextProps & {
  priceMinor: number;
  currency: string;
  locale: string;
};

export function PriceTag({ priceMinor, currency, locale, fw = 700, ...rest }: Props) {
  return (
    <Text fw={fw} {...rest}>
      {formatPrice(priceMinor, currency, locale)}
    </Text>
  );
}
