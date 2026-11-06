import {
  Anchor,
  Avatar,
  Badge,
  Button,
  Group,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import type { UserListQuery } from "@vendor-hub/types";
import { EmptyState, ErrorAlert, PageHeader } from "@vendor-hub/ui";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { useCountries } from "../../hooks/useCountries";
import { useUsers } from "../../hooks/useUsers";
import { userPath } from "../../paths";
import {
  PAGE_SIZES,
  hasActiveFilters,
  nextSort,
  readFilters,
  writeFilters,
  type Filters,
  type SortField,
} from "./filters";

type CountryCode = NonNullable<UserListQuery["country"]>;

const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_ROWS = 6;
const SKELETON_HEIGHT = 44;
const TABLE_MIN_WIDTH = 640;
const AVATAR_SIZE = 36;
const PLACEHOLDER_OPACITY = 0.55;

export default function UserList() {
  const t = useT();
  const locale = useLocale();
  const { options: countryOptions, countryName } = useCountries();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const [searchInput, setSearchInput] = useState(filters.search);
  const knownCountry = countryOptions.some((option) => option.value === filters.country)
    ? (filters.country as CountryCode)
    : undefined;
  const { data, isPending, isError, isPlaceholderData, refetch } = useUsers({
    limit: filters.pageSize,
    offset: (filters.page - 1) * filters.pageSize,
    search: filters.search === "" ? undefined : filters.search,
    role: filters.role ?? undefined,
    country: knownCountry,
    sort: filters.sort,
    order: filters.order,
  });

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

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
    applyFilters({ search: "", role: null, country: null });
  };

  const sortHeader = (field: SortField, label: string) => {
    const active = filters.sort === field;

    return (
      <Table.Th
        aria-sort={active ? (filters.order === "asc" ? "ascending" : "descending") : "none"}
      >
        <UnstyledButton
          mih={24}
          onClick={() => applyFilters({ ...nextSort(filters, field), page: 1 })}
          aria-label={t("users.sort", { column: label })}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <Text size="sm" fw={600} component="span">
            {label}
          </Text>
          <span aria-hidden="true">{active ? (filters.order === "asc" ? "↑" : "↓") : "↕"}</span>
        </UnstyledButton>
      </Table.Th>
    );
  };

  const roleOptions = [
    { value: "administrator", label: t("role.administrator") },
    { value: "regular", label: t("role.regular") },
  ];

  const header = (
    <PageHeader
      title={t("users.title")}
      description={data ? t("users.total", { total: data.meta.total }) : t("users.description")}
    />
  );

  const filterBar = (
    <Paper withBorder radius="md" p="md">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" verticalSpacing="sm">
        <TextInput
          label={t("users.search.label")}
          placeholder={t("users.search.placeholder")}
          value={searchInput}
          onChange={(event) => handleSearchChange(event.currentTarget.value)}
          type="search"
          autoComplete="off"
        />
        <Select
          label={t("users.filter.role")}
          placeholder={t("users.filter.any")}
          data={roleOptions}
          value={filters.role}
          onChange={(value) =>
            applyFilters({ role: value === "administrator" || value === "regular" ? value : null })
          }
          clearable
        />
        <Select
          label={t("users.filter.country")}
          placeholder={t("users.filter.any")}
          data={countryOptions}
          value={filters.country}
          onChange={(value) => applyFilters({ country: value })}
          searchable
          clearable
        />
        <Group align="flex-end" justify="flex-end">
          <Button
            variant="default"
            onClick={resetFilters}
            disabled={!hasActiveFilters(filters) && searchInput === ""}
          >
            {t("users.filter.reset")}
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
          title={t("users.error.title")}
          message={t("users.error.message")}
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
  const filtered = hasActiveFilters(filters);

  return (
    <Stack gap="md">
      {header}
      {filterBar}

      {data.data.length === 0 ? (
        <Paper withBorder radius="md" p="md">
          <EmptyState
            title={filtered ? t("users.emptyFiltered.title") : t("users.empty.title")}
            description={
              filtered ? t("users.emptyFiltered.description") : t("users.empty.description")
            }
          />
        </Paper>
      ) : (
        <Paper
          withBorder
          radius="md"
          style={{ overflow: "hidden", opacity: isPlaceholderData ? PLACEHOLDER_OPACITY : 1 }}
        >
          <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  {sortHeader("name", t("users.col.user"))}
                  {sortHeader("role", t("users.col.role"))}
                  {sortHeader("country", t("users.col.country"))}
                  {sortHeader("createdAt", t("users.col.created"))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.data.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar size={AVATAR_SIZE} radius="xl" color="primer">
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </Avatar>
                        <div>
                          <Anchor component={Link} to={userPath(user.id)} fw={500} size="sm">
                            {user.firstName} {user.lastName}
                          </Anchor>
                          <Text size="xs" c="dimmed">
                            {user.email}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant={user.role === "administrator" ? "filled" : "light"}
                        color={user.role === "administrator" ? "primer" : "gray"}
                      >
                        {t(`role.${user.role}`)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{countryName(user.country)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{dateFormat.format(new Date(user.createdAt))}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      {total > 0 ? (
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              {t("users.range", { from, to, total })}
            </Text>
            <Select
              aria-label={t("users.pageSize")}
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
              aria-label={t("users.pagination")}
            />
          ) : null}
        </Group>
      ) : null}
    </Stack>
  );
}
