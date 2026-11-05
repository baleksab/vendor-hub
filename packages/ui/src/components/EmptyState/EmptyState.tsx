import { Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <Stack align="center" gap="xs" py="xl">
      <Text fw={600}>{title}</Text>
      {description === undefined ? null : (
        <Text size="sm" c="dimmed" ta="center">
          {description}
        </Text>
      )}
      {action}
    </Stack>
  );
}
