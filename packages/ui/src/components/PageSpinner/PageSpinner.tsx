import { Center, Loader, Stack, Text } from "@mantine/core";

const MIN_HEIGHT = "50vh";

export function PageSpinner({ label }: { label: string }) {
  return (
    <Center mih={MIN_HEIGHT}>
      <Stack align="center" gap="sm" component="output">
        <Loader />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}
