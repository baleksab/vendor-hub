import {
  Badge,
  Button,
  Drawer,
  Group,
  NativeSelect,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { EmptyState, ProductCard } from "@vendor-hub/ui";
import type {
  CategoryResponse,
  ProductCategoryCountListResponse,
  ProductListResponse,
} from "@vendor-hub/types";
import { Form, Link, useNavigate } from "react-router";

import { AddToCartForm } from "../../../components/AddToCartForm/AddToCartForm";
import { useLocale, useT } from "../../../i18n/LocaleProvider";
import {
  PRODUCT_PAGE_SIZE,
  PRODUCT_SORTS,
  toSearchParams,
  type ProductFilters,
} from "../../../vendor/products/productFilters";
import { categoryName } from "../../../vendor/products/categoryNames";
import { productImagePath, productPath } from "../../../vendor/vendorPaths";
import { ProductFilterForm } from "./ProductFilterForm";

type Props = {
  slug: string;
  filters: ProductFilters;
  categories: CategoryResponse[];
  counts: ProductCategoryCountListResponse["data"];
  products: ProductListResponse;
};

function hrefFor(filters: ProductFilters): string {
  const query = toSearchParams(filters).toString();

  return query === "" ? "?" : `?${query}`;
}

export function ProductsTab({ slug, filters, categories, counts, products }: Props) {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const [drawerOpened, drawer] = useDisclosure(false);
  const pages = Math.max(1, Math.ceil(products.meta.total / PRODUCT_PAGE_SIZE));
  const clearHref = "?";
  const filterQuery = toSearchParams(filters).toString();

  const productHref = (productId: string) =>
    filterQuery === ""
      ? productPath(slug, productId)
      : `${productPath(slug, productId)}?${filterQuery}`;

  const chips: { key: string; label: string; href: string }[] = [];
  const without = (patch: Partial<ProductFilters>) => hrefFor({ ...filters, ...patch, page: 1 });

  if (filters.q !== null) {
    chips.push({
      key: "q",
      label: t("products.filter.search", { query: filters.q }),
      href: without({ q: null }),
    });
  }

  if (filters.category !== null) {
    chips.push({
      key: "category",
      label: categoryName(categories, filters.category, locale),
      href: without({ category: null }),
    });
  }

  if (filters.minRating !== null) {
    chips.push({
      key: "minRating",
      label: t("products.filter.ratingUp", { stars: filters.minRating }),
      href: without({ minRating: null }),
    });
  }

  if (filters.minPrice !== null) {
    chips.push({
      key: "minPrice",
      label: `${t("products.filter.minPrice")} ${filters.minPrice}`,
      href: without({ minPrice: null }),
    });
  }

  if (filters.maxPrice !== null) {
    chips.push({
      key: "maxPrice",
      label: `${t("products.filter.maxPrice")} ${filters.maxPrice}`,
      href: without({ maxPrice: null }),
    });
  }

  if (filters.inStock) {
    chips.push({
      key: "inStock",
      label: t("products.filter.inStock"),
      href: without({ inStock: false }),
    });
  }

  const filterForm = (idPrefix: string, onSubmit?: () => void) => (
    <ProductFilterForm
      filters={filters}
      categories={categories}
      counts={counts}
      clearHref={clearHref}
      idPrefix={idPrefix}
      onSubmit={onSubmit}
    />
  );

  return (
    <Group align="flex-start" gap="xl" wrap="nowrap">
      <Stack visibleFrom="md" w={260} gap="md" flex="none" component="aside">
        {filterForm("side")}
      </Stack>

      <Stack gap="md" flex={1} miw={0}>
        <Form method="get">
          {filters.category === null ? null : (
            <input type="hidden" name="category" value={filters.category} />
          )}
          {filters.minRating === null ? null : (
            <input type="hidden" name="minRating" value={filters.minRating} />
          )}
          {filters.minPrice === null ? null : (
            <input type="hidden" name="minPrice" value={filters.minPrice} />
          )}
          {filters.maxPrice === null ? null : (
            <input type="hidden" name="maxPrice" value={filters.maxPrice} />
          )}
          {filters.inStock ? <input type="hidden" name="inStock" value="true" /> : null}

          <Group align="flex-end" gap="xs" wrap="wrap">
            <TextInput
              name="q"
              type="search"
              flex={1}
              miw={200}
              aria-label={t("products.search.label")}
              placeholder={t("products.search.placeholder")}
              defaultValue={filters.q ?? ""}
              size="md"
            />
            <NativeSelect
              name="sort"
              size="md"
              aria-label={t("products.sort.label")}
              defaultValue={filters.sort ?? ""}
              data={[
                { value: "", label: t("products.sort.relevance") },
                ...PRODUCT_SORTS.filter((sort) => sort !== "relevance").map((sort) => ({
                  value: sort,
                  label: t(`products.sort.${sort}`),
                })),
              ]}
            />
            <Button type="submit" size="md" mih={44}>
              {t("products.filters.apply")}
            </Button>
            <Button hiddenFrom="md" variant="default" size="md" mih={44} onClick={drawer.open}>
              {t("products.filters")}
            </Button>
          </Group>
        </Form>

        {chips.length === 0 ? null : (
          <Group
            component="ul"
            gap="xs"
            p={0}
            m={0}
            style={{ listStyle: "none" }}
            aria-label={t("products.filters.active")}
          >
            {chips.map((chip) => (
              <li key={chip.key}>
                <Badge
                  component={Link}
                  to={chip.href}
                  variant="light"
                  size="lg"
                  tt="none"
                  aria-label={t("products.filters.remove", { filter: chip.label })}
                  rightSection="×"
                  style={{ cursor: "pointer" }}
                >
                  {chip.label}
                </Badge>
              </li>
            ))}
          </Group>
        )}

        <Text size="sm" c="dimmed">
          {t("products.count", { count: products.meta.total })}
        </Text>

        {products.data.length === 0 ? (
          <EmptyState
            title={chips.length === 0 ? t("products.empty") : t("products.emptyFiltered")}
            action={
              chips.length === 0 ? undefined : (
                <Button component={Link} to={clearHref} variant="light" mih={44}>
                  {t("products.filters.clear")}
                </Button>
              )
            }
          />
        ) : (
          <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }} spacing="md">
            {products.data.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                href={productHref(product.id)}
                linkComponent={Link}
                imageUrl={
                  product.coverImageId === null ? null : productImagePath(product.coverImageId)
                }
                priceMinor={product.priceMinor}
                currency={product.currency}
                locale={locale}
                stock={product.stock}
                ratingAvg={product.ratingAvg}
                ratingCount={product.ratingCount}
                ratingLabel={t("review.aria", { rating: product.ratingAvg.toFixed(1) })}
                noImageLabel={t("products.noImage")}
                action={
                  <AddToCartForm productId={product.id} name={product.name} stock={product.stock} />
                }
                outOfStockLabel={t("stock.out")}
                inStockLabel={t("stock.in")}
                lowStockLabel={(count) => t("stock.low", { count })}
              />
            ))}
          </SimpleGrid>
        )}

        {pages <= 1 ? null : (
          <Pagination
            total={pages}
            value={filters.page}
            onChange={(page) => void navigate(hrefFor({ ...filters, page }))}
            getControlProps={(control) => ({
              "aria-label": `${t("products.pagination")}: ${control}`,
            })}
            mt="md"
          />
        )}
      </Stack>

      <Drawer
        opened={drawerOpened}
        onClose={drawer.close}
        title={t("products.filters")}
        position="right"
        hiddenFrom="md"
      >
        {filterForm("drawer", drawer.close)}
      </Drawer>
    </Group>
  );
}
