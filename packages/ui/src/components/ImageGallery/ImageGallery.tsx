import { AspectRatio, Group, Image, Stack, UnstyledButton } from "@mantine/core";
import { useState } from "react";

type Props = {
  images: { id: string; url: string }[];
  alt: string;
  emptyLabel: string;
};

export function ImageGallery({ images, alt, emptyLabel }: Props) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  if (current === undefined) {
    return (
      <AspectRatio ratio={4 / 3}>
        <Group justify="center" bg="var(--mantine-color-default-hover)" c="dimmed" fz="sm">
          {emptyLabel}
        </Group>
      </AspectRatio>
    );
  }

  return (
    <Stack gap="xs">
      <AspectRatio ratio={4 / 3}>
        <Image src={current.url} alt={alt} fit="contain" radius="md" />
      </AspectRatio>

      {images.length < 2 ? null : (
        <Group gap="xs">
          {images.map((image, index) => (
            <UnstyledButton
              key={image.id}
              onClick={() => setSelected(index)}
              aria-label={`${alt} ${index + 1}`}
              aria-current={index === selected}
              w={64}
              h={64}
              style={{
                borderRadius: "var(--mantine-radius-sm)",
                overflow: "hidden",
                outline:
                  index === selected ? "2px solid var(--mantine-primary-color-filled)" : "none",
              }}
            >
              <Image src={image.url} alt="" w={64} h={64} fit="cover" loading="lazy" />
            </UnstyledButton>
          ))}
        </Group>
      )}
    </Stack>
  );
}
