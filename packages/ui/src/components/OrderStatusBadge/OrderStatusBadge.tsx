import { Badge } from "@mantine/core";

const COLORS: Record<string, string> = {
  created: "gray",
  paid: "blue",
  delivered: "teal",
  closed: "green",
  cancelled: "red",
  return_requested: "yellow",
  return_approved: "grape",
  return_rejected: "orange",
};

export function orderNumber(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function OrderStatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge color={COLORS[status] ?? "gray"} variant="light">
      {label}
    </Badge>
  );
}
