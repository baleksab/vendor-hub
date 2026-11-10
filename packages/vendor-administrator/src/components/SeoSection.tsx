import { Stack, Text, Title } from "@mantine/core";
import { SEO_DESCRIPTION_MAX, SeoFields, SeoPreview } from "@vendor-hub/ui";
import type { ReactNode } from "react";

import { useT } from "../context/MessagesContext";

type Props = {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  fallbackTitle: string;
  fallbackDescription: string;
  url: string;
  siteName: string;
  imageUrl?: string;
  titleError?: string;
  descriptionError?: string;
  imageSlot?: ReactNode;
};

export function SeoSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  fallbackTitle,
  fallbackDescription,
  url,
  siteName,
  imageUrl,
  titleError,
  descriptionError,
  imageSlot,
}: Props) {
  const t = useT();
  const customTitle = title.trim();
  const customDescription = description.trim();
  const shownFallbackDescription = fallbackDescription.slice(0, SEO_DESCRIPTION_MAX);

  return (
    <Stack gap="md">
      <div>
        <Title order={2} size="h4">
          {t("seo.section")}
        </Title>
        <Text size="sm" c="dimmed">
          {t("seo.help")}
        </Text>
      </div>

      <SeoFields
        title={title}
        description={description}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
        titleLabel={t("seo.title.label")}
        descriptionLabel={t("seo.description.label")}
        titlePlaceholder={fallbackTitle}
        descriptionPlaceholder={shownFallbackDescription}
        titleError={titleError}
        descriptionError={descriptionError}
        counterLabel={(length, max) => t("seo.counter", { length, max })}
        imageSlot={imageSlot}
      />

      <SeoPreview
        title={customTitle === "" ? fallbackTitle : customTitle}
        description={customDescription === "" ? shownFallbackDescription : customDescription}
        url={url}
        siteName={siteName}
        imageUrl={imageUrl}
        usingDefaultTitle={customTitle === ""}
        usingDefaultDescription={customDescription === ""}
        labels={{
          google: t("seo.preview.google"),
          social: t("seo.preview.social"),
          desktop: t("seo.preview.desktop"),
          mobile: t("seo.preview.mobile"),
          usingDefault: t("seo.preview.usingDefault"),
          note: t("seo.preview.note"),
          empty: t("seo.preview.empty"),
        }}
      />
    </Stack>
  );
}
