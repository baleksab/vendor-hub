import { Group, Rating, Text, VisuallyHidden } from "@mantine/core";

type Props = {
  value: number;
  count?: number;
  label: string;
  size?: "xs" | "sm" | "md" | "lg";
};

export function StarRating({ value, count, label, size = "sm" }: Props) {
  return (
    <Group gap={6} wrap="nowrap">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Rating value={value} fractions={4} readOnly size={size} aria-hidden />
      {count === undefined ? null : (
        <Text size="xs" c="dimmed" aria-hidden>
          ({count})
        </Text>
      )}
    </Group>
  );
}
