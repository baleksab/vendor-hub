import { Stack, Text, TextInput, Textarea } from "@mantine/core";
import type { ReactNode } from "react";

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

const WARNING_RATIO = 0.9;
const INPUT_ORDER: ("label" | "input" | "description" | "error")[] = [
  "label",
  "input",
  "description",
  "error",
];

type Props = {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  titleLabel: string;
  descriptionLabel: string;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  titleError?: string;
  descriptionError?: string;
  counterLabel: (length: number, max: number) => string;
  imageSlot?: ReactNode;
};

function Counter({
  length,
  max,
  label,
}: {
  length: number;
  max: number;
  label: (length: number, max: number) => string;
}) {
  const color = length > max ? "red" : length > max * WARNING_RATIO ? "orange" : "dimmed";

  return (
    <Text span size="xs" c={color} aria-live="polite">
      {label(length, max)}
    </Text>
  );
}

export function SeoFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  titleLabel,
  descriptionLabel,
  titlePlaceholder,
  descriptionPlaceholder,
  titleError,
  descriptionError,
  counterLabel,
  imageSlot,
}: Props) {
  return (
    <Stack gap="md">
      <TextInput
        label={titleLabel}
        value={title}
        placeholder={titlePlaceholder}
        error={titleError}
        size="md"
        inputWrapperOrder={INPUT_ORDER}
        description={
          <Counter length={title.trim().length} max={SEO_TITLE_MAX} label={counterLabel} />
        }
        onChange={(event) => onTitleChange(event.currentTarget.value)}
      />
      <Textarea
        label={descriptionLabel}
        value={description}
        placeholder={descriptionPlaceholder}
        error={descriptionError}
        size="md"
        autosize
        minRows={3}
        inputWrapperOrder={INPUT_ORDER}
        description={
          <Counter
            length={description.trim().length}
            max={SEO_DESCRIPTION_MAX}
            label={counterLabel}
          />
        }
        onChange={(event) => onDescriptionChange(event.currentTarget.value)}
      />
      {imageSlot}
    </Stack>
  );
}
