import { Alert, Paper, Stack, Text, Title } from "@mantine/core";
import { ReviewList } from "@vendor-hub/ui";

import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { useDeleteProductReview, useProductReviews } from "../../hooks/useProductReviews";

export function ReviewsModeration({ productId }: { productId: string }) {
  const t = useT();
  const locale = useLocale();
  const reviews = useProductReviews(productId);
  const remove = useDeleteProductReview(productId);

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={2} size="h4">
            {t("reviews.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("reviews.description")}
          </Text>
        </div>

        {reviews.isError ? <Alert color="red">{t("reviews.error")}</Alert> : null}
        {remove.isError ? (
          <Alert color="red" role="alert">
            {t("reviews.deleteFailed")}
          </Alert>
        ) : null}

        {reviews.data === undefined ? null : (
          <ReviewList
            reviews={reviews.data.data.map((review) => ({
              id: review.id,
              authorName: review.authorName,
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt,
              canDelete: true,
            }))}
            locale={locale}
            emptyLabel={t("reviews.empty")}
            deleteLabel={t("reviews.delete")}
            ratingLabel={(rating) => t("reviews.rating", { rating })}
            onDelete={(reviewId) => remove.mutate(reviewId)}
            deletingId={remove.isPending ? (remove.variables ?? null) : null}
          />
        )}
      </Stack>
    </Paper>
  );
}
