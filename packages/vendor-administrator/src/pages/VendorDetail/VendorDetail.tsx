import { Anchor, Group, Skeleton, Stack, Title } from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import { EmptyState, ErrorAlert } from "@vendor-hub/ui";
import { useParams } from "react-router";

import { BackLink } from "../../components/BackLink";
import { RoleBadge } from "../../components/RoleBadge";
import { useT } from "../../context/MessagesContext";
import { useVendor } from "../../hooks/useVendor";
import { VENDORS_PATH, vendorSitePath } from "../../paths";
import { AddOperatorForm } from "./AddOperatorForm";
import { DeleteVendor } from "./DeleteVendor";
import { MembersTable } from "./MembersTable";
import { VendorForm } from "./VendorForm";

const NOT_FOUND = 404;
const FORM_SKELETON_HEIGHT = 320;

export default function VendorDetail() {
  const t = useT();
  const { id = "" } = useParams();
  const { data: vendor, error, isPending, refetch } = useVendor(id);

  const back = <BackLink to={VENDORS_PATH}>{t("vendor.back")}</BackLink>;

  if (isPending) {
    return <Skeleton height={FORM_SKELETON_HEIGHT} />;
  }

  if (error) {
    if (error instanceof ApiError && error.status === NOT_FOUND) {
      return (
        <EmptyState
          title={t("vendor.notFound.title")}
          description={t("vendor.notFound.message")}
          action={back}
        />
      );
    }

    return (
      <Stack>
        {back}
        <ErrorAlert
          title={t("vendor.loadError.title")}
          message={t("vendor.loadError.message")}
          retryLabel={t("common.retry")}
          onRetry={() => void refetch()}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {back}
      <Stack gap={4} mb="sm">
        <Title order={1}>{vendor.name}</Title>
        <Group gap="sm">
          <RoleBadge role={vendor.memberRole} />
          <Anchor href={vendorSitePath(vendor.slug)} size="sm">
            {vendor.slug}
          </Anchor>
        </Group>
      </Stack>
      <VendorForm vendor={vendor} />
      <MembersTable vendor={vendor} />
      <AddOperatorForm vendorId={vendor.id} />
      {vendor.canDelete ? <DeleteVendor vendor={vendor} /> : null}
    </Stack>
  );
}
