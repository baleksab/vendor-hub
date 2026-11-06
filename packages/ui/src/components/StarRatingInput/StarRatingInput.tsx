import { Input, Rating } from "@mantine/core";

type Props = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  error?: string;
};

export function StarRatingInput({ value, onChange, label, error }: Props) {
  return (
    <Input.Wrapper label={label} error={error}>
      <Rating value={value} onChange={onChange} size="lg" mt={4} aria-label={label} />
    </Input.Wrapper>
  );
}
