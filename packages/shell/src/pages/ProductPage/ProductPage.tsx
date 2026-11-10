import { Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { BackLink, ImageGallery, PriceTag, StarRating, StockBadge } from "@vendor-hub/ui";
import type { MouseEvent } from "react";
import { data, Link, useLocation, useNavigate } from "react-router";

import { ApiError } from "@vendor-hub/api-client";
import { getProduct } from "../../api/endpoints/products.server";
import { listProductReviews } from "../../api/endpoints/reviews.server";
import { loginPath } from "../../auth/safeRedirect";
import { AddToCartForm } from "../../components/AddToCartForm/AddToCartForm";
import { ReviewSection } from "../../components/ReviewSection/ReviewSection";
import { insightsProductPath } from "../../vendor/insightsLink";
import { manageProductPath } from "../../vendor/manageVendorsLink";
import { useSession } from "../../hooks/useSession/useSession";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { reviewAction } from "../../reviews/reviewAction.server";
import { createPageMeta } from "../../seo/createMeta";
import { pageMeta, readRootData } from "../../seo/pageMeta";
import { resolveProductSeo } from "../../seo/resolveSeo";
import { createT } from "../../i18n";
import { productImagePath, productPath, vendorPath } from "../../vendor/vendorPaths";
import type { Route } from "./+types/ProductPage";

const REVIEWS_LIMIT = 50;

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const product = await getProduct(params.productId);

    if (product.vendorSlug.toLowerCase() !== params.slug.toLowerCase()) {
      throw data(null, { status: 404 });
    }

    const reviews = await listProductReviews(product.id, { limit: REVIEWS_LIMIT, offset: 0 });

    return { product, reviews };
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
    const seo = resolveProductSeo(
      product,
      t("seo.product.title", { name: product.name, vendor: product.vendorName }),
    );

    return createPageMeta({
      title: seo.title,
      description: seo.description,
      path,
      origin: root.origin,
      locale: root.locale,
      siteName: product.vendorName,
      image: seo.imageId === undefined ? undefined : productImagePath(seo.imageId),
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
  const { product, reviews } = loaderData;
  const t = useT();
  const locale = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, vendors } = useSession();
  const base = vendorPath(params.slug);
  const isMember =
    vendors?.owned?.slug === product.vendorSlug ||
    vendors?.operating.some((candidate) => candidate.slug === product.vendorSlug) === true;

  const canManage = user?.role === "administrator" || isMember;

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (location.key !== "default") {
      event.preventDefault();
      void navigate(-1);
    }
  };

  return (
    <Stack component="article" gap="xl">
      <BackLink
        to={`${base}${location.search}`}
        label={product.vendorName}
        linkComponent={Link}
        onClick={goBack}
      />

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
          <Group justify="space-between" align="center" wrap="nowrap" gap="md">
            <Title order={1} fz={{ base: 28, sm: 36 }}>
              {product.name}
            </Title>
            {canManage || isMember ? (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                {isMember ? (
                  <Button
                    component={Link}
                    to={insightsProductPath(product.vendorId, product.id)}
                    variant="default"
                    mih={44}
                  >
                    {t("product.insights")}
                  </Button>
                ) : null}
                {canManage ? (
                  <Button
                    component={Link}
                    to={manageProductPath(product.vendorId, product.id)}
                    variant="default"
                    mih={44}
                  >
                    {t("product.manage")}
                  </Button>
                ) : null}
              </Group>
            ) : null}
          </Group>
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
          <AddToCartForm
            productId={product.id}
            name={product.name}
            stock={product.stock}
            withQuantity
          />
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
        canModerate={canManage}
        loginPath={loginPath(productPath(params.slug, product.id))}
      />
    </Stack>
  );
}
