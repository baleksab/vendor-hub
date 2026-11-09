import { Text } from "@mantine/core";

import { useT } from "../context/MessagesContext";

const PERCENT = 100;

type Props = { current: number; previous: number | null };

export function Trend({ current, previous }: Props) {
  const t = useT();

  if (previous === null || (previous === 0 && current === 0)) {
    return null;
  }

  if (previous === 0) {
    return (
      <Text size="xs" c="dimmed">
        {t("trend.new")}
      </Text>
    );
  }

  const percent = Math.round(((current - previous) / Math.abs(previous)) * PERCENT);
  const color = percent === 0 ? "dimmed" : percent > 0 ? "teal" : "red";

  return (
    <Text size="xs" c={color}>
      {percent > 0 ? "+" : ""}
      {percent}% {t("trend.vsPrevious")}
    </Text>
  );
}
