import { Anchor, Breadcrumbs, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ImageGallery, PriceTag, StarRating, StockBadge } from "@vendor-hub/ui";
import { data, Link } from "react-router";

import { ApiError } from "@vendor-hub/api-client";
import { listCategories, getProduct } from "../../api/endpoints/products.server";
import { listProductReviews } from "../../api/endpoints/reviews.server";
import { loginPath } from "../../auth/safeRedirect";
import { ReviewSection } from "../../components/ReviewSection/ReviewSection";
import { useSession } from "../../hooks/useSession/useSession";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { reviewAction } from "../../reviews/reviewAction.server";
import { createPageMeta } from "../../seo/createMeta";
import { pageMeta, readRootData } from "../../seo/pageMeta";
import { createT } from "../../i18n";
import { categoryName } from "../../vendor/products/categoryNames";
import { productImagePath, productPath, VENDORS_PATH, vendorPath } from "../../vendor/vendorPaths";
import type { Route } from "./+types/ProductPage";

const REVIEWS_LIMIT = 50;
const DESCRIPTION_MAX = 160;

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const product = await getProduct(params.productId);

    if (product.vendorSlug.toLowerCase() !== params.slug.toLowerCase()) {
      throw data(null, { status: 404 });
    }

    const [reviews, categories] = await Promise.all([
      listProductReviews(product.id, { limit: REVIEWS_LIMIT, offset: 0 }),
      listCategories(),
    ]);

    return { product, reviews, categories: categories.data };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      throw data(null, { status: 404 });
    }

    throw error;
  }
}

export function action({ request }: Route.ActionArgs) {
  return reviewAction(request);
}

export function meta({ matches, loaderData, params }: Route.MetaArgs) {
  const product = loaderData?.product;
  const root = readRootData(matches);
  const path = productPath(params.slug, params.productId);

  if (product && root) {
    const t = createT(root.locale);
    const cover = product.images[0];

    return createPageMeta({
      title: t("seo.product.title", { name: product.name, vendor: product.vendorName }),
      description: product.description.slice(0, DESCRIPTION_MAX),
      path,
      origin: root.origin,
      locale: root.locale,
      siteName: product.vendorName,
      image: cover === undefined ? undefined : productImagePath(cover.id),
    });
  }

  return pageMeta(matches, {
    titleKey: "seo.notFound.title",
    descriptionKey: "seo.notFound.description",
    path,
    noindex: true,
  });
}

export default function ProductPage({ loaderData, params }: Route.ComponentProps) {
  const { product, reviews, categories } = loaderData;
  const t = useT();
  const locale = useLocale();
  const { user, vendors } = useSession();
  const base = vendorPath(params.slug);
  const isMember =
    vendors?.owned?.slug === product.vendorSlug ||
    vendors?.operating.some((candidate) => candidate.slug === product.vendorSlug) === true;

  const trail = [
    { label: t("nav.vendors"), to: VENDORS_PATH },
    { label: product.vendorName, to: base },
    ...(product.parentCategory === null
      ? []
      : [
          {
            label: categoryName(categories, product.parentCategory, locale),
            to: `${base}?category=${product.parentCategory}`,
          },
        ]),
    {
      label: categoryName(categories, product.category, locale),
      to: `${base}?category=${product.category}`,
    },
  ];

  return (
    <Stack component="article" gap="xl">
      <Breadcrumbs aria-label={t("product.breadcrumbs")}>
        {trail.map((item) => (
          <Anchor key={item.to} component={Link} to={item.to} size="sm">
            {item.label}
          </Anchor>
        ))}
        <Text size="sm" c="dimmed">
          {product.name}
        </Text>
      </Breadcrumbs>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <ImageGallery
          images={product.images.map((image) => ({
            id: image.id,
            url: productImagePath(image.id),
          }))}
          alt={product.name}
          emptyLabel={t("product.noImages")}
        />

        <Stack gap="md">
          <Title order={1} fz={{ base: 28, sm: 36 }}>
            {product.name}
          </Title>
          <StarRating
            value={product.ratingAvg}
            count={product.ratingCount}
            label={t("review.aria", { rating: product.ratingAvg.toFixed(1) })}
            size="md"
          />
          <Group gap="md">
            <PriceTag
              priceMinor={product.priceMinor}
              currency={product.currency}
              locale={locale}
              fz={28}
            />
            <StockBadge
              stock={product.stock}
              outOfStockLabel={t("stock.out")}
              inStockLabel={t("stock.in")}
              lowStockLabel={(count) => t("stock.low", { count })}
            />
          </Group>
          <Text size="sm" c="dimmed">
            {t("product.vendor", { vendor: product.vendorName })}
          </Text>
          <Stack gap="xs">
            <Title order={2} fz="lg">
              {t("product.description")}
            </Title>
            <Text style={{ whiteSpace: "pre-line" }}>{product.description}</Text>
          </Stack>
        </Stack>
      </SimpleGrid>

      <ReviewSection
        target="product"
        targetId={product.id}
        reviews={reviews}
        currentUserId={user?.id ?? null}
        canModerate={user?.role === "administrator" || isMember}
        loginPath={loginPath(productPath(params.slug, product.id))}
      />
    </Stack>
  );
}
