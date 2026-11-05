import { Anchor, Badge, Group, Skeleton, Stack } from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import { EmptyState, ErrorAlert, PageHeader } from "@vendor-hub/ui";
import { Link, useParams } from "react-router";

import { useT } from "../../context/MessagesContext";
import { useUser } from "../../hooks/useUser";
import { USERS_PATH } from "../../paths";
import { UserForm } from "./UserForm";

const NOT_FOUND = 404;
const CHEVRON_SIZE = 16;
const FORM_SKELETON_HEIGHT = 320;

export default function UserDetail() {
  const t = useT();
  const { id = "" } = useParams();
  const { data: user, error, isPending, refetch } = useUser(id);

  const back = (
    <Anchor component={Link} to={USERS_PATH} size="sm" w="fit-content">
      <Group gap={4} wrap="nowrap">
        <svg
          width={CHEVRON_SIZE}
          height={CHEVRON_SIZE}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {t("user.back")}
      </Group>
    </Anchor>
  );

  if (isPending) {
    return <Skeleton height={FORM_SKELETON_HEIGHT} />;
  }

  if (error) {
    if (error instanceof ApiError && error.status === NOT_FOUND) {
      return (
        <EmptyState
          title={t("user.notFound.title")}
          description={t("user.notFound.message")}
          action={back}
        />
      );
    }

    return (
      <Stack>
        {back}
        <ErrorAlert
          title={t("user.loadError.title")}
          message={t("user.loadError.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetch()}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {back}
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        actions={
          <Badge
            size="lg"
            variant={user.role === "administrator" ? "filled" : "light"}
            color={user.role === "administrator" ? "primer" : "gray"}
          >
            {t(`role.${user.role}`)}
          </Badge>
        }
      />
      <UserForm user={user} />
    </Stack>
  );
}
