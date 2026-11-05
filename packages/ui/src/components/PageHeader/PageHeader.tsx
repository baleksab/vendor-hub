import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
  return (
    <Group justify="space-between" align="flex-start" wrap="wrap" mb="lg">
      <Stack gap={4}>
        <Title order={1}>{title}</Title>
        {description === undefined ? null : (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
      </Stack>
      {actions}
    </Group>
  );
}
