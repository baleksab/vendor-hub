import { Anchor, Badge, Pagination, Skeleton, Stack, Table, Text } from "@mantine/core";
import { EmptyState, ErrorAlert, PageHeader } from "@vendor-hub/ui";
import { Link, useSearchParams } from "react-router";

import { useT } from "../../context/MessagesContext";
import { useUsers } from "../../hooks/useUsers";
import { userPath } from "../../paths";

const PAGE_SIZE = 20;
const SKELETON_ROWS = 5;
const SKELETON_HEIGHT = 36;

function readPage(raw: string | null): number {
  const page = Number(raw);

  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export default function UserList() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams.get("page"));
  const { data, isPending, isError, refetch } = useUsers({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const handlePageChange = (next: number) => {
    setSearchParams(next === 1 ? {} : { page: String(next) });
  };

  const header = (
    <PageHeader
      title={t("users.title")}
      description={data ? t("users.total", { total: data.meta.total }) : t("users.description")}
    />
  );

  if (isPending) {
    return (
      <Stack gap="xs">
        {header}
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} height={SKELETON_HEIGHT} />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <Stack>
        {header}
        <ErrorAlert
          title={t("users.error.title")}
          message={t("users.error.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetch()}
        />
      </Stack>
    );
  }

  const pageCount = Math.max(1, Math.ceil(data.meta.total / PAGE_SIZE));

  return (
    <Stack gap="md">
      {header}

      {data.data.length === 0 ? (
        <EmptyState title={t("users.empty.title")} description={t("users.empty.description")} />
      ) : (
        <Table.ScrollContainer minWidth={560}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("users.col.name")}</Table.Th>
                <Table.Th>{t("users.col.email")}</Table.Th>
                <Table.Th>{t("users.col.role")}</Table.Th>
                <Table.Th>{t("users.col.country")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.data.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Anchor component={Link} to={userPath(user.id)} fw={500}>
                      {user.firstName} {user.lastName}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant={user.role === "administrator" ? "filled" : "light"}
                      color={user.role === "administrator" ? "primer" : "gray"}
                    >
                      {t(`role.${user.role}`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{user.country}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {pageCount > 1 ? (
        <Pagination
          total={pageCount}
          value={page}
          onChange={handlePageChange}
          aria-label={t("users.pagination")}
        />
      ) : null}
    </Stack>
  );
}
