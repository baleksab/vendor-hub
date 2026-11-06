import { Group, Progress, Stack, Text } from "@mantine/core";

import { StarRating } from "../StarRating/StarRating";

type Props = {
  ratingAvg: number;
  ratingCount: number;
  distribution: number[];
  ratingLabel: string;
  countLabel: string;
  starsLabel: (stars: number) => string;
};

export function ReviewSummary({
  ratingAvg,
  ratingCount,
  distribution,
  ratingLabel,
  countLabel,
  starsLabel,
}: Props) {
  return (
    <Group align="flex-start" gap="xl" wrap="wrap">
      <Stack gap={2}>
        <Text fz={40} fw={700} lh={1}>
          {ratingAvg.toFixed(1)}
        </Text>
        <StarRating value={ratingAvg} label={ratingLabel} />
        <Text size="sm" c="dimmed">
          {countLabel}
        </Text>
      </Stack>

      <Stack gap={4} flex={1} miw={200} maw={360}>
        {[5, 4, 3, 2, 1].map((stars) => {
          const total = distribution[stars - 1] ?? 0;

          return (
            <Group key={stars} gap="xs" wrap="nowrap">
              <Text size="xs" w={56}>
                {starsLabel(stars)}
              </Text>
              <Progress
                value={ratingCount === 0 ? 0 : (total / ratingCount) * 100}
                flex={1}
                aria-label={starsLabel(stars)}
              />
              <Text size="xs" c="dimmed" w={24} ta="right">
                {total}
              </Text>
            </Group>
          );
        })}
      </Stack>
    </Group>
  );
}
