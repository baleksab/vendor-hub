import {
  Anchor,
  Button,
  Checkbox,
  Group,
  Image,
  Modal,
  NumberInput,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import type { ProductListItemResponse } from "@vendor-hub/types";
import { BackLink, EmptyState, ErrorAlert, PageHeader, PriceTag, StarRating } from "@vendor-hub/ui";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { categoryLabel, leafCategoryGroups } from "../../categoryOptions";
import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { useCategories } from "../../hooks/useCategories";
import { useDeleteProduct } from "../../hooks/useDeleteProduct";
import { useProducts } from "../../hooks/useProducts";
import { useUpdateProduct } from "../../hooks/useUpdateProduct";
import { useVendor } from "../../hooks/useVendor";
import { newProductPath, productImagePath, productPath, vendorPath } from "../../paths";
import {
  PRODUCT_PAGE_SIZE,
  hasActiveFilters,
  nextSort,
  readFilters,
  toApiSort,
  writeFilters,
  type ProductFilters,
  type ProductSortField,
} from "./filters";

const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_ROWS = 6;
const SKELETON_HEIGHT = 44;
const THUMBNAIL_SIZE = 40;

function StockCell({ product }: { product: ProductListItemResponse }) {
  const t = useT();
  const mutation = useUpdateProduct(product.id);
  const [value, setValue] = useState<number | string>(product.stock);

  const save = () => {
    if (typeof value !== "number" || value === product.stock) {
      setValue(product.stock);

      return;
    }

    mutation.mutate({ stock: value }, { onError: () => setValue(product.stock) });
  };

  return (
    <Stack gap={2}>
      <NumberInput
        value={value}
        onChange={setValue}
        onBlur={save}
        min={0}
        allowDecimal={false}
        allowNegative={false}
        w={90}
        size="xs"
        aria-label={t("products.stockLabel", { name: product.name })}
        disabled={mutation.isPending}
      />
      {mutation.isError ? (
        <Text size="xs" c="red" role="alert">
          {t("products.stockFailed")}
        </Text>
      ) : null}
    </Stack>
  );
}

export default function ProductList() {
  const t = useT();
  const locale = useLocale();
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const [search, setSearch] = useState(filters.search);
  const [toDelete, setToDelete] = useState<ProductListItemResponse | null>(null);
  const vendor = useVendor(id);
  const categories = useCategories();
  const deletion = useDeleteProduct();
  const tree = categories.data?.data ?? [];

  const products = useProducts(vendor.data?.slug, {
    ...(filters.search === "" ? {} : { q: filters.search }),
    ...(filters.category === "" ? {} : { category: filters.category }),
    inStock: filters.inStock,
    sort: toApiSort(filters),
    limit: PRODUCT_PAGE_SIZE,
    offset: (filters.page - 1) * PRODUCT_PAGE_SIZE,
  });

  const update = (patch: Partial<ProductFilters>) =>
    setSearchParams(writeFilters({ ...filters, page: 1, ...patch }));

  const debouncedSearch = useDebouncedCallback(
    (value: string) => update({ search: value }),
    SEARCH_DEBOUNCE_MS,
  );

  const sortBy = (field: ProductSortField) => update({ ...nextSort(filters, field) });

  const header = (field: ProductSortField, label: string) => (
    <UnstyledButton
      onClick={() => sortBy(field)}
      aria-label={t("products.sort", { column: label })}
      fw={600}
      fz="sm"
    >
      {label}
      {filters.sort === field ? (filters.order === "asc" ? " ↑" : " ↓") : ""}
    </UnstyledButton>
  );

  const confirmDelete = () => {
    if (toDelete === null) return;

    deletion.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
  };

  const total = products.data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE));
  const items = products.data?.data ?? [];

  return (
    <Stack gap="md">
      <BackLink to={vendorPath(id)} label={t("products.back")} linkComponent={Link} />

      <PageHeader
        title={t("products.title")}
        description={
          vendor.data ? t("products.description", { name: vendor.data.name }) : undefined
        }
        actions={
          <Button component={Link} to={newProductPath(id)} mih={44}>
            {t("products.new")}
          </Button>
        }
      />

      <Paper withBorder radius="md" p="md">
        <Group align="flex-end" gap="md" wrap="wrap">
          <TextInput
            label={t("products.search.label")}
            placeholder={t("products.search.placeholder")}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              debouncedSearch(event.currentTarget.value);
            }}
            flex={1}
            miw={200}
          />
          <Select
            label={t("products.filter.category")}
            placeholder={t("products.filter.all")}
            data={leafCategoryGroups(tree, locale)}
            value={filters.category === "" ? null : filters.category}
            onChange={(value) => update({ category: value ?? "" })}
            clearable
            w={220}
          />
          <Checkbox
            label={t("products.filter.inStock")}
            checked={filters.inStock}
            onChange={(event) => update({ inStock: event.currentTarget.checked })}
            mb={8}
          />
          {hasActiveFilters(filters) ? (
            <Button
              variant="subtle"
              onClick={() => {
                setSearch("");
                setSearchParams(new URLSearchParams());
              }}
            >
              {t("products.reset")}
            </Button>
          ) : null}
        </Group>
      </Paper>

      {products.isError ? (
        <ErrorAlert
          title={t("products.error.title")}
          message={t("products.error.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void products.refetch()}
        />
      ) : products.isPending || vendor.isPending ? (
        <Stack gap="xs">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height={SKELETON_HEIGHT} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters(filters)
              ? t("products.emptyFiltered.title")
              : t("products.empty.title")
          }
          description={
            hasActiveFilters(filters)
              ? t("products.emptyFiltered.description")
              : t("products.empty.description")
          }
        />
      ) : (
        <>
          <Text size="sm" c="dimmed">
            {t("products.total", { total })}
          </Text>

          <Table.ScrollContainer minWidth={760}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={THUMBNAIL_SIZE + 16} />
                  <Table.Th>{header("name", t("products.col.name"))}</Table.Th>
                  <Table.Th>{t("products.col.category")}</Table.Th>
                  <Table.Th>{header("priceMinor", t("products.col.price"))}</Table.Th>
                  <Table.Th>{t("products.col.stock")}</Table.Th>
                  <Table.Th>{header("ratingAvg", t("products.col.rating"))}</Table.Th>
                  <Table.Th>{header("createdAt", t("products.col.created"))}</Table.Th>
                  <Table.Th>{t("products.col.actions")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((product) => (
                  <Table.Tr key={product.id}>
                    <Table.Td>
                      {product.coverImageId === null ? (
                        <Text size="xs" c="dimmed">
                          {t("products.noImage")}
                        </Text>
                      ) : (
                        <Image
                          src={productImagePath(product.coverImageId)}
                          alt=""
                          w={THUMBNAIL_SIZE}
                          h={THUMBNAIL_SIZE}
                          fit="cover"
                          radius="sm"
                          loading="lazy"
                        />
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Anchor component={Link} to={productPath(id, product.id)} fw={600}>
                        {product.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{categoryLabel(tree, product.category, locale)}</Table.Td>
                    <Table.Td>
                      <PriceTag
                        priceMinor={product.priceMinor}
                        currency={product.currency}
                        locale={locale}
                        fw={500}
                      />
                    </Table.Td>
                    <Table.Td>
                      <StockCell product={product} />
                    </Table.Td>
                    <Table.Td>
                      <StarRating
                        value={product.ratingAvg}
                        count={product.ratingCount}
                        label={t("reviews.rating", { rating: product.ratingAvg.toFixed(1) })}
                        size="xs"
                      />
                    </Table.Td>
                    <Table.Td>
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(product.createdAt),
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Button
                          component={Link}
                          to={productPath(id, product.id)}
                          variant="light"
                          size="compact-sm"
                        >
                          {t("products.edit")}
                        </Button>
                        <Button
                          variant="subtle"
                          color="red"
                          size="compact-sm"
                          onClick={() => setToDelete(product)}
                        >
                          {t("products.delete")}
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {pages <= 1 ? null : (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {t("products.range", {
                  from: (filters.page - 1) * PRODUCT_PAGE_SIZE + 1,
                  to: Math.min(filters.page * PRODUCT_PAGE_SIZE, total),
                  total,
                })}
              </Text>
              <Pagination
                total={pages}
                value={filters.page}
                onChange={(page) => setSearchParams(writeFilters({ ...filters, page }))}
                aria-label={t("products.pagination")}
              />
            </Group>
          )}
        </>
      )}

      <Modal
        opened={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t("products.deleteTitle", { name: toDelete?.name ?? "" })}
      >
        <Stack>
          <Text size="sm">{t("products.deleteText")}</Text>
          {deletion.isError ? (
            <Text size="sm" c="red" role="alert">
              {t("products.deleteFailed")}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setToDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button color="red" loading={deletion.isPending} onClick={confirmDelete}>
              {t("products.deleteConfirm")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
