import { Alert } from "@mantine/core";

export function FormAlert({ messageText }: { messageText: string | null | undefined }) {
  if (!messageText) {
    return null;
  }

  return (
    <Alert color="red" role="alert">
      {messageText}
    </Alert>
  );
}
