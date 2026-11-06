import {
  Button,
  Group,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { BackLink, EmptyState, ErrorAlert, PageHeader } from "@vendor-hub/ui";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useT } from "../../context/MessagesContext";
import { useManagedVendors } from "../../hooks/useManagedVendors";
import { BECOME_VENDOR_PATH, PUBLIC_VENDORS_PATH } from "../../paths";
import {
  PAGE_SIZES,
  hasActiveFilters,
  readFilters,
  writeFilters,
  type Filters,
  type Relation,
} from "./filters";
import { VendorQuickView } from "./VendorQuickView";
import { VendorTable } from "./VendorTable";

const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_ROWS = 6;
const SKELETON_HEIGHT = 44;
const TITLE_SKELETON_WIDTH = 220;
const TITLE_SKELETON_HEIGHT = 36;

export default function VendorList() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isPending, isError, isPlaceholderData, refetch } = useManagedVendors({
    limit: filters.pageSize,
    offset: (filters.page - 1) * filters.pageSize,
    search: filters.search === "" ? undefined : filters.search,
    relation: filters.relation ?? undefined,
    sort: filters.sort,
    order: filters.order,
  });

  const applyFilters = (patch: Partial<Filters>) => {
    setSearchParams(writeFilters({ ...filters, page: 1, ...patch }), { replace: true });
  };

  const commitSearch = useDebouncedCallback((value: string) => {
    applyFilters({ search: value.trim() });
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    commitSearch(value);
  };

  const resetFilters = () => {
    commitSearch.cancel();
    setSearchInput("");
    applyFilters({ search: "", relation: null });
  };

  const filtered = hasActiveFilters(filters);
  const selected = data?.data.find((vendor) => vendor.id === selectedId) ?? null;

  const title =
    data === undefined ? (
      <Skeleton width={TITLE_SKELETON_WIDTH} height={TITLE_SKELETON_HEIGHT} mb="lg" />
    ) : (
      <PageHeader
        title={data.scope === "all" ? t("vendors.title.all") : t("vendors.title.mine")}
        description={t("vendors.total", { total: data.meta.total })}
      />
    );

  const header = (
    <>
      <BackLink to={PUBLIC_VENDORS_PATH} linkComponent={Link}>
        {t("vendors.back")}
      </BackLink>
      {title}
    </>
  );

  const filterBar = (
    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="sm">
        <TextInput
          label={t("vendors.search.label")}
          placeholder={t("vendors.search.placeholder")}
          value={searchInput}
          onChange={(event) => handleSearchChange(event.currentTarget.value)}
          type="search"
          autoComplete="off"
        />
        <Select
          label={t("vendors.filter.relation")}
          placeholder={t("vendors.filter.any")}
          data={[
            { value: "owned", label: t("vendors.filter.owned") },
            { value: "operated", label: t("vendors.filter.operated") },
          ]}
          value={filters.relation}
          onChange={(value) =>
            applyFilters({
              relation: value === "owned" || value === "operated" ? (value as Relation) : null,
            })
          }
          clearable
        />
        <Group align="flex-end" justify="flex-end">
          <Button
            variant="default"
            onClick={resetFilters}
            disabled={!filtered && searchInput === ""}
          >
            {t("vendors.filter.reset")}
          </Button>
        </Group>
      </SimpleGrid>
    </Paper>
  );

  if (isError) {
    return (
      <Stack>
        {header}
        {filterBar}
        <ErrorAlert
          title={t("vendors.error.title")}
          message={t("vendors.error.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetch()}
        />
      </Stack>
    );
  }

  if (isPending) {
    return (
      <Stack gap="md">
        {header}
        {filterBar}
        <Stack gap="xs">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height={SKELETON_HEIGHT} />
          ))}
        </Stack>
      </Stack>
    );
  }

  const { total } = data.meta;
  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const from = (filters.page - 1) * filters.pageSize + 1;
  const to = Math.min(total, filters.page * filters.pageSize);
  const isAdministratorView = data.scope === "all";

  return (
    <Stack gap="md">
      {header}
      {filterBar}

      {data.data.length === 0 ? (
        <Paper withBorder radius="md" p="md">
          {filtered ? (
            <EmptyState
              title={t("vendors.emptyFiltered.title")}
              description={t("vendors.emptyFiltered.description")}
              action={
                <Button variant="default" onClick={resetFilters}>
                  {t("vendors.filter.reset")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={t("vendors.empty.title")}
              description={t("vendors.empty.description")}
              action={
                isAdministratorView ? undefined : (
                  <Button component={Link} to={BECOME_VENDOR_PATH}>
                    {t("vendors.empty.become")}
                  </Button>
                )
              }
            />
          )}
        </Paper>
      ) : (
        <VendorTable
          vendors={data.data}
          filters={filters}
          stale={isPlaceholderData}
          onSort={applyFilters}
          onOpen={(vendor) => setSelectedId(vendor.id)}
        />
      )}

      {total > 0 ? (
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              {t("vendors.range", { from, to, total })}
            </Text>
            <Select
              aria-label={t("vendors.pageSize")}
              data={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))}
              value={String(filters.pageSize)}
              onChange={(value) => applyFilters({ pageSize: Number(value) })}
              allowDeselect={false}
              w={80}
              size="xs"
            />
          </Group>
          {pageCount > 1 ? (
            <Pagination
              total={pageCount}
              value={filters.page}
              onChange={(page) => applyFilters({ page })}
              aria-label={t("vendors.pagination")}
            />
          ) : null}
        </Group>
      ) : null}

      <VendorQuickView vendor={selected} onClose={() => setSelectedId(null)} />
    </Stack>
  );
}
