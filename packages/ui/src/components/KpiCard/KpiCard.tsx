import { Badge, Paper, Stack, Text } from "@mantine/core";

const PERCENT = 100;

type Props = {
  label: string;
  value: string;
  current: number;
  previous: number | null;
  deltaLabel: string;
  higherIsBetter?: boolean;
  noDataLabel: string;
};

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return ((current - previous) / Math.abs(previous)) * PERCENT;
}

export function KpiCard({
  label,
  value,
  current,
  previous,
  deltaLabel,
  higherIsBetter = true,
  noDataLabel,
}: Props) {
  const delta = previous === null ? null : deltaPercent(current, previous);
  const rounded = delta === null ? null : Math.round(delta);
  const improved = rounded === null || rounded === 0 ? null : rounded > 0 === higherIsBetter;
  const color = improved === null ? "gray" : improved ? "teal" : "red";
  const sign = rounded !== null && rounded > 0 ? "+" : "";

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap={6}>
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        <Text fz={26} fw={700} lh={1.1}>
          {value}
        </Text>
        {previous === null ? null : (
          <Badge variant="light" color={color} size="sm" aria-label={deltaLabel}>
            {rounded === null ? noDataLabel : `${sign}${rounded}%`}
          </Badge>
        )}
      </Stack>
    </Paper>
  );
}
