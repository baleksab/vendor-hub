import { Badge, Skeleton, Stack } from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import { BackLink, EmptyState, ErrorAlert, PageHeader } from "@vendor-hub/ui";
import { Link, useParams } from "react-router";

import { useT } from "../../context/MessagesContext";
import { useUser } from "../../hooks/useUser";
import { USERS_PATH } from "../../paths";
import { UserForm } from "./UserForm";

const NOT_FOUND = 404;
const FORM_SKELETON_HEIGHT = 320;

export default function UserDetail() {
  const t = useT();
  const { id = "" } = useParams();
  const { data: user, error, isPending, refetch } = useUser(id);

  const back = (
    <BackLink to={USERS_PATH} linkComponent={Link}>
      {t("user.back")}
    </BackLink>
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
