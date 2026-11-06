import { Anchor, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { ReviewList, ReviewSummary, StarRatingInput } from "@vendor-hub/ui";
import type { ReviewListResponse } from "@vendor-hub/types";
import { useState } from "react";
import { Link, useFetcher } from "react-router";

import type { FormErrors } from "../../forms/formErrors.server";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { REVIEW_COMMENT_MAX } from "../../reviews/reviewSchema";
import { FormAlert } from "../FormAlert/FormAlert";
import { FormField } from "../FormField/FormField";

type ActionResult = { ok: true } | FormErrors;

type Props = {
  target: "product" | "vendor";
  targetId: string;
  reviews: ReviewListResponse;
  currentUserId: string | null;
  canModerate: boolean;
  loginPath: string;
};

export function ReviewSection({
  target,
  targetId,
  reviews,
  currentUserId,
  canModerate,
  loginPath,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const fetcher = useFetcher<ActionResult>();
  const own = reviews.data.find((review) => review.userId === currentUserId);
  const [rating, setRating] = useState(own?.rating ?? 0);
  const errors = fetcher.data !== undefined && !("ok" in fetcher.data) ? fetcher.data : null;
  const intent = target === "product" ? "ProductReview" : "VendorReview";
  const submitting = fetcher.state !== "idle";

  const remove = (reviewId: string) =>
    fetcher.submit({ intent: `delete${intent}`, targetId, reviewId }, { method: "post" });

  return (
    <Stack component="section" gap="lg" aria-labelledby={`reviews-${target}`}>
      <Title order={2} id={`reviews-${target}`} fz="xl">
        {t("review.title")}
      </Title>

      <ReviewSummary
        ratingAvg={reviews.summary.ratingAvg}
        ratingCount={reviews.summary.ratingCount}
        distribution={reviews.summary.distribution}
        ratingLabel={t("review.aria", { rating: reviews.summary.ratingAvg.toFixed(1) })}
        countLabel={t("review.count", { count: reviews.summary.ratingCount })}
        starsLabel={(stars) => t("review.stars", { stars })}
      />

      {currentUserId === null ? (
        <Text size="sm">
          <Anchor component={Link} to={loginPath}>
            {t("review.loginPrompt")}
          </Anchor>
        </Text>
      ) : (
        <Paper withBorder p="md" radius="md">
          <fetcher.Form method="post" noValidate key={own?.id ?? "new"}>
            <Stack gap="sm">
              <Title order={3} fz="md">
                {own === undefined ? t("review.formTitle") : t("review.yourReview")}
              </Title>
              <input type="hidden" name="intent" value={`save${intent}`} />
              <input type="hidden" name="targetId" value={targetId} />
              <input type="hidden" name="rating" value={rating} />
              <StarRatingInput
                value={rating}
                onChange={setRating}
                label={t("review.rating")}
                error={errors?.fields.rating ? t("review.validation.rating") : undefined}
              />
              <FormField
                name="comment"
                kind="textarea"
                label={t("review.comment")}
                maxLength={REVIEW_COMMENT_MAX}
                defaultValue={own?.comment ?? ""}
                error={errors?.fields.comment}
              />
              <FormAlert message={errors?.form} />
              <Button type="submit" mih={44} loading={submitting} w="fit-content">
                {own === undefined ? t("review.submit") : t("review.update")}
              </Button>
            </Stack>
          </fetcher.Form>
        </Paper>
      )}

      <ReviewList
        reviews={reviews.data.map((review) => ({
          id: review.id,
          authorName: review.authorName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          canDelete: canModerate || review.userId === currentUserId,
        }))}
        locale={locale}
        emptyLabel={t("review.empty")}
        deleteLabel={t("review.delete")}
        ratingLabel={(value) => t("review.aria", { rating: value })}
        onDelete={remove}
      />
    </Stack>
  );
}
