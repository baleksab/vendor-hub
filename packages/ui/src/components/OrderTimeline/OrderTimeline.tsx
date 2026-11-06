import { Text, Timeline } from "@mantine/core";

export type OrderEventKind = "created" | "paymentFailed" | "statusChange";

export function orderEventKind(fromStatus: string | null, toStatus: string): OrderEventKind {
  if (fromStatus === null) {
    return "created";
  }

  return fromStatus === toStatus ? "paymentFailed" : "statusChange";
}

type Entry = {
  id: string;
  title: string;
  actorLabel: string;
  note: string | null;
  createdAt: string;
};

export function OrderTimeline({ entries, locale }: { entries: Entry[]; locale: string }) {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Timeline active={entries.length - 1} bulletSize={14} lineWidth={2}>
      {entries.map((entry) => (
        <Timeline.Item key={entry.id} title={entry.title}>
          <Text size="xs" c="dimmed">
            {formatter.format(new Date(entry.createdAt))} · {entry.actorLabel}
          </Text>
          {entry.note === null ? null : (
            <Text size="sm" mt={4} style={{ whiteSpace: "pre-line" }}>
              {entry.note}
            </Text>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
