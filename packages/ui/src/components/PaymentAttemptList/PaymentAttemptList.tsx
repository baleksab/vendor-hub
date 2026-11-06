import { Badge, Group, Stack, Text } from "@mantine/core";

import { PriceTag } from "../PriceTag/PriceTag";

type Attempt = {
  id: string;
  label: string;
  succeeded: boolean;
  statusLabel: string;
  reason: string | null;
  amountMinor: number;
  currency: string;
  createdAt: string;
};

type Props = { attempts: Attempt[]; locale: string; emptyLabel: string };

export function PaymentAttemptList({ attempts, locale, emptyLabel }: Props) {
  if (attempts.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Stack gap="sm">
      {attempts.map((attempt) => (
        <Group key={attempt.id} justify="space-between" wrap="nowrap" align="flex-start">
          <Stack gap={2} miw={0}>
            <Group gap="xs">
              <Text fw={500} size="sm">
                {attempt.label}
              </Text>
              <Badge color={attempt.succeeded ? "green" : "red"} variant="light" size="sm">
                {attempt.statusLabel}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {formatter.format(new Date(attempt.createdAt))}
              {attempt.reason === null ? "" : ` · ${attempt.reason}`}
            </Text>
          </Stack>
          <PriceTag
            priceMinor={attempt.amountMinor}
            currency={attempt.currency}
            locale={locale}
            size="sm"
            fw={500}
          />
        </Group>
      ))}
    </Stack>
  );
}
