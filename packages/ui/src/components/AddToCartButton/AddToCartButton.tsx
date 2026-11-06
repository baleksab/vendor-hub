import { Button } from "@mantine/core";

type Props = {
  stock: number;
  label: string;
  outOfStockLabel: string;
  loading?: boolean;
  fullWidth?: boolean;
};

export function AddToCartButton({
  stock,
  label,
  outOfStockLabel,
  loading = false,
  fullWidth = false,
}: Props) {
  const soldOut = stock <= 0;

  return (
    <Button type="submit" mih={44} disabled={soldOut} loading={loading} fullWidth={fullWidth}>
      {soldOut ? outOfStockLabel : label}
    </Button>
  );
}
