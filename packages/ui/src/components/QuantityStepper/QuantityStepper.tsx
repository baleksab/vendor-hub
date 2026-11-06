import { ActionIcon, Group, NumberInput } from "@mantine/core";

const CONTROL_SIZE = 44;
const INPUT_WIDTH = 64;

type Props = {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  name?: string;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  disabled?: boolean;
};

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  name,
  label,
  decreaseLabel,
  increaseLabel,
  disabled = false,
}: Props) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <Group gap={4} wrap="nowrap">
      <ActionIcon
        variant="default"
        size={CONTROL_SIZE}
        aria-label={decreaseLabel}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </ActionIcon>
      <NumberInput
        name={name}
        value={value}
        onChange={(next) => onChange(clamp(typeof next === "number" ? next : min))}
        min={min}
        max={max}
        allowDecimal={false}
        allowNegative={false}
        clampBehavior="strict"
        hideControls
        aria-label={label}
        disabled={disabled}
        w={INPUT_WIDTH}
        styles={{ input: { textAlign: "center", height: CONTROL_SIZE } }}
      />
      <ActionIcon
        variant="default"
        size={CONTROL_SIZE}
        aria-label={increaseLabel}
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </ActionIcon>
    </Group>
  );
}
