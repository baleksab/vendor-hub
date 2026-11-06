import { Group, Stack, Table, Text } from "@mantine/core";

import { formatPrice, PriceTag } from "../PriceTag/PriceTag";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

type Props = {
  items: Item[];
  currency: string;
  totalMinor: number;
  locale: string;
  labels: {
    product: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
    total: string;
  };
};

export function OrderItemsTable({ items, currency, totalMinor, locale, labels }: Props) {
  const price = (value: number, bold = false) => (
    <PriceTag priceMinor={value} currency={currency} locale={locale} fw={bold ? 700 : 400} />
  );

  return (
    <Stack gap="sm">
      <Table verticalSpacing="sm" visibleFrom="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{labels.product}</Table.Th>
            <Table.Th ta="right">{labels.quantity}</Table.Th>
            <Table.Th ta="right">{labels.unitPrice}</Table.Th>
            <Table.Th ta="right">{labels.lineTotal}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>{item.name}</Table.Td>
              <Table.Td ta="right">{item.quantity}</Table.Td>
              <Table.Td ta="right">{price(item.unitPriceMinor)}</Table.Td>
              <Table.Td ta="right">{price(item.lineTotalMinor)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Stack gap="sm" hiddenFrom="sm">
        {items.map((item) => (
          <Group key={item.id} justify="space-between" wrap="nowrap" align="flex-start">
            <Stack gap={0} miw={0}>
              <Text fw={500}>{item.name}</Text>
              <Text size="sm" c="dimmed">
                {item.quantity} × {formatPrice(item.unitPriceMinor, currency, locale)}
              </Text>
            </Stack>
            {price(item.lineTotalMinor)}
          </Group>
        ))}
      </Stack>

      <Group justify="space-between">
        <Text fw={600}>{labels.total}</Text>
        {price(totalMinor, true)}
      </Group>
    </Stack>
  );
}
