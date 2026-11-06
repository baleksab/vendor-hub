import { Badge } from "@mantine/core";

export const LOW_STOCK_THRESHOLD = 5;

type Props = {
  stock: number;
  outOfStockLabel: string;
  inStockLabel: string;
  lowStockLabel: (stock: number) => string;
};

export function StockBadge({ stock, outOfStockLabel, inStockLabel, lowStockLabel }: Props) {
  if (stock <= 0) {
    return (
      <Badge color="red" variant="light">
        {outOfStockLabel}
      </Badge>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <Badge color="yellow" variant="light">
        {lowStockLabel(stock)}
      </Badge>
    );
  }

  return (
    <Badge color="green" variant="light">
      {inStockLabel}
    </Badge>
  );
}
