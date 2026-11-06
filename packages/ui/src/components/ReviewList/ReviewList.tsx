import { Button, Divider, Group, Stack, Text } from "@mantine/core";
import { Fragment } from "react";

import { StarRating } from "../StarRating/StarRating";

export type ReviewListItem = {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  canDelete: boolean;
};

type Props = {
  reviews: ReviewListItem[];
  locale: string;
  emptyLabel: string;
  deleteLabel: string;
  ratingLabel: (rating: number) => string;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
};

export function ReviewList({
  reviews,
  locale,
  emptyLabel,
  deleteLabel,
  ratingLabel,
  onDelete,
  deletingId = null,
}: Props) {
  if (reviews.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyLabel}
      </Text>
    );
  }

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <Stack gap="md">
      {reviews.map((review, index) => (
        <Fragment key={review.id}>
          {index === 0 ? null : <Divider />}
          <Stack gap={4}>
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Group gap="xs">
                <Text fw={600} size="sm">
                  {review.authorName}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatter.format(new Date(review.createdAt))}
                </Text>
              </Group>
              {review.canDelete && onDelete !== undefined ? (
                <Button
                  variant="subtle"
                  color="red"
                  size="compact-sm"
                  loading={deletingId === review.id}
                  onClick={() => onDelete(review.id)}
                >
                  {deleteLabel}
                </Button>
              ) : null}
            </Group>
            <StarRating value={review.rating} label={ratingLabel(review.rating)} size="xs" />
            {review.comment === null ? null : (
              <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                {review.comment}
              </Text>
            )}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  );
}
