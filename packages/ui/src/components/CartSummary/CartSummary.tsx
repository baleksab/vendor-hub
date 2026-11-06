import { Divider, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

import { PriceTag } from "../PriceTag/PriceTag";

type Props = {
  title: string;
  totals: { currency: string; totalMinor: number }[];
  totalLabel: string;
  locale: string;
  note?: string;
  children?: ReactNode;
};

export function CartSummary({ title, totals, totalLabel, locale, note, children }: Props) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={2} fz="lg">
          {title}
        </Title>
        <Divider />
        {totals.map((total) => (
          <Group key={total.currency} justify="space-between">
            <Text>{totalLabel}</Text>
            <PriceTag
              priceMinor={total.totalMinor}
              currency={total.currency}
              locale={locale}
              size="lg"
            />
          </Group>
        ))}
        {note ? (
          <Text size="sm" c="dimmed">
            {note}
          </Text>
        ) : null}
        {children}
      </Stack>
    </Paper>
  );
}
