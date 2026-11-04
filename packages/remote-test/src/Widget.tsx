import { Button, Paper, Text } from "@mantine/core";
import { useState, version } from "react";

export default function Widget() {
  const [count, setCount] = useState(0);

  return (
    <Paper withBorder p="md">
      <Text size="sm">Remote widget, React {version}</Text>

      <Button mt="xs" onClick={() => setCount((value) => value + 1)}>
        Count: {count}
      </Button>
    </Paper>
  );
}
