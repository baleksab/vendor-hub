import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import type { ProductResponse } from "@vendor-hub/types";
import { useRef, useState, type DragEvent } from "react";

import { useT } from "../../context/MessagesContext";
import {
  useDeleteProductImage,
  useReorderProductImages,
  useUploadProductImage,
} from "../../hooks/useProductImages";
import { productImagePath } from "../../paths";

const PAYLOAD_TOO_LARGE = 413;
const UNSUPPORTED_MEDIA_TYPE = 415;
const CONFLICT = 409;
const PREVIEW_SIZE = 96;

export function ImagesEditor({ product }: { product: ProductResponse }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadProductImage(product.id);
  const reorder = useReorderProductImages(product.id);
  const remove = useDeleteProductImage(product.id);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [failures, setFailures] = useState<string[]>([]);

  const describeFailure = (name: string, error: unknown): string => {
    const status = error instanceof ApiError ? error.status : 0;

    if (status === UNSUPPORTED_MEDIA_TYPE) return t("images.failed.type", { name });
    if (status === PAYLOAD_TOO_LARGE) return t("images.failed.size", { name });
    if (status === CONFLICT) return t("images.failed.limit", { name });

    return t("images.failed.generic", { name });
  };

  const send = async (files: File[]) => {
    setFailures([]);

    for (const file of files) {
      setUploading(file.name);

      try {
        await upload.mutateAsync(file);
      } catch (error) {
        setFailures((current) => [...current, describeFailure(file.name, error)]);
      }
    }

    setUploading(null);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void send([...event.dataTransfer.files]);
  };

  const move = (index: number, offset: number) => {
    const ids = product.images.map((image) => image.id);
    const target = index + offset;
    const moved = ids[index];
    const other = ids[target];

    if (moved === undefined || other === undefined) return;

    ids[index] = other;
    ids[target] = moved;
    reorder.mutate(ids);
  };

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={2} size="h4">
            {t("images.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("images.description")}
          </Text>
        </div>

        <Stack
          align="center"
          gap="xs"
          p="lg"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: "2px dashed var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-md)",
            background: dragging ? "var(--mantine-color-default-hover)" : undefined,
          }}
        >
          <Text size="sm">{t("images.drop")}</Text>
          <Button
            variant="light"
            onClick={() => input.current?.click()}
            loading={uploading !== null}
          >
            {t("images.choose")}
          </Button>
          <input
            ref={input}
            type="file"
            hidden
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              void send([...(event.currentTarget.files ?? [])]);
              event.currentTarget.value = "";
            }}
          />
          {uploading === null ? null : (
            <Text size="xs" c="dimmed" aria-live="polite">
              {t("images.uploading", { name: uploading })}
            </Text>
          )}
        </Stack>

        {failures.map((message) => (
          <Alert key={message} color="red" role="alert">
            {message}
          </Alert>
        ))}

        {product.images.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("images.empty")}
          </Text>
        ) : (
          <Group gap="md" align="flex-start">
            {product.images.map((image, index) => (
              <Stack key={image.id} gap={6} w={PREVIEW_SIZE}>
                <Image
                  src={productImagePath(image.id)}
                  alt={t("images.alt", { number: index + 1 })}
                  w={PREVIEW_SIZE}
                  h={PREVIEW_SIZE}
                  fit="cover"
                  radius="sm"
                />
                {index === 0 ? <Badge size="sm">{t("images.cover")}</Badge> : null}
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    variant="default"
                    size="lg"
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                    aria-label={t("images.moveEarlier", { number: index + 1 })}
                  >
                    ←
                  </ActionIcon>
                  <ActionIcon
                    variant="default"
                    size="lg"
                    disabled={index === product.images.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                    aria-label={t("images.moveLater", { number: index + 1 })}
                  >
                    →
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="lg"
                    loading={remove.isPending && remove.variables === image.id}
                    onClick={() => remove.mutate(image.id)}
                    aria-label={t("images.remove", { number: index + 1 })}
                  >
                    ×
                  </ActionIcon>
                </Group>
              </Stack>
            ))}
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
