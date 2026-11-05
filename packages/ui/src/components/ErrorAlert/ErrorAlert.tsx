import { Alert, Button } from "@mantine/core";

type Props = {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorAlert({ title, message, retryLabel, onRetry }: Props) {
  return (
    <Alert color="red" title={title} role="alert">
      {message}
      {retryLabel !== undefined && onRetry !== undefined ? (
        <Button variant="default" size="xs" mt="sm" display="block" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Alert>
  );
}
