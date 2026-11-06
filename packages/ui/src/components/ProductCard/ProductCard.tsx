import { AspectRatio, Card, Group, Image, Stack, Text } from "@mantine/core";
import type { ComponentType, CSSProperties, ReactNode } from "react";

import { PriceTag } from "../PriceTag/PriceTag";
import { StarRating } from "../StarRating/StarRating";
import { StockBadge } from "../StockBadge/StockBadge";

type LinkProps = { to: string; style?: CSSProperties; children?: ReactNode };

type Props = {
  name: string;
  href: string;
  linkComponent: ComponentType<LinkProps>;
  imageUrl: string | null;
  priceMinor: number;
  currency: string;
  locale: string;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  ratingLabel: string;
  noImageLabel: string;
  outOfStockLabel: string;
  inStockLabel: string;
  lowStockLabel: (stock: number) => string;
};

export function ProductCard(props: Props) {
  const Link = props.linkComponent;

  return (
    <Link to={props.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <Card withBorder padding="sm" radius="md" h="100%">
        <Card.Section>
          <AspectRatio ratio={4 / 3}>
            {props.imageUrl === null ? (
              <Group justify="center" bg="var(--mantine-color-default-hover)" c="dimmed" fz="sm">
                {props.noImageLabel}
              </Group>
            ) : (
              <Image src={props.imageUrl} alt="" fit="cover" loading="lazy" />
            )}
          </AspectRatio>
        </Card.Section>

        <Stack gap={6} mt="sm">
          <Text fw={600} lineClamp={2}>
            {props.name}
          </Text>
          <PriceTag
            priceMinor={props.priceMinor}
            currency={props.currency}
            locale={props.locale}
            size="lg"
          />
          <Group justify="space-between" gap="xs">
            <StarRating
              value={props.ratingAvg}
              count={props.ratingCount}
              label={props.ratingLabel}
              size="xs"
            />
            <StockBadge
              stock={props.stock}
              outOfStockLabel={props.outOfStockLabel}
              inStockLabel={props.inStockLabel}
              lowStockLabel={props.lowStockLabel}
            />
          </Group>
        </Stack>
      </Card>
    </Link>
  );
}
