import { Alert, AspectRatio, Box, Group, Image, Stack, Text } from "@mantine/core";
import type { ComponentType, CSSProperties, ReactNode } from "react";

import { PriceTag } from "../PriceTag/PriceTag";

type LinkProps = { to: string; style?: CSSProperties; children?: ReactNode };

const THUMBNAIL_SIZE = 72;

type Props = {
  name: string;
  href: string | null;
  linkComponent: ComponentType<LinkProps>;
  imageUrl: string | null;
  noImageLabel: string;
  priceMinor: number | null;
  lineTotalMinor: number;
  currency: string | null;
  locale: string;
  quantityControl: ReactNode;
  removeControl: ReactNode;
  warning?: string | null;
};

export function CartLine(props: Props) {
  const Link = props.linkComponent;
  const linkStyle = { color: "inherit", textDecoration: "none" };

  return (
    <Stack gap="xs" py="md">
      <Group align="flex-start" wrap="nowrap" gap="md">
        <Box w={THUMBNAIL_SIZE} style={{ flexShrink: 0 }}>
          <AspectRatio ratio={1}>
            {props.imageUrl === null ? (
              <Group justify="center" bg="var(--mantine-color-default-hover)" c="dimmed" fz="xs">
                {props.noImageLabel}
              </Group>
            ) : (
              <Image src={props.imageUrl} alt="" fit="cover" radius="sm" loading="lazy" />
            )}
          </AspectRatio>
        </Box>

        <Stack gap={4} flex={1} miw={0}>
          {props.href === null ? (
            <Text fw={600} lineClamp={2}>
              {props.name}
            </Text>
          ) : (
            <Link to={props.href} style={linkStyle}>
              <Text fw={600} lineClamp={2}>
                {props.name}
              </Text>
            </Link>
          )}
          {props.priceMinor === null || props.currency === null ? null : (
            <PriceTag
              priceMinor={props.priceMinor}
              currency={props.currency}
              locale={props.locale}
              fw={400}
              size="sm"
              c="dimmed"
            />
          )}
        </Stack>

        {props.currency === null ? null : (
          <PriceTag
            priceMinor={props.lineTotalMinor}
            currency={props.currency}
            locale={props.locale}
            visibleFrom="xs"
          />
        )}
      </Group>

      <Group justify="space-between" gap="sm">
        {props.quantityControl}
        <Group gap="sm">
          {props.currency === null ? null : (
            <PriceTag
              priceMinor={props.lineTotalMinor}
              currency={props.currency}
              locale={props.locale}
              hiddenFrom="xs"
            />
          )}
          {props.removeControl}
        </Group>
      </Group>

      {props.warning ? (
        <Alert color="yellow" variant="light" p="xs">
          {props.warning}
        </Alert>
      ) : null}
    </Stack>
  );
}
