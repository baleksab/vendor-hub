import { Anchor, Group, Skeleton, Stack } from "@mantine/core";
import { ApiError } from "@vendor-hub/api-client";
import { EmptyState, ErrorAlert, PageHeader } from "@vendor-hub/ui";
import { Link, useParams } from "react-router";

import { RoleBadge } from "../../components/RoleBadge";
import { useT } from "../../context/MessagesContext";
import { useVendor } from "../../hooks/useVendor";
import { VENDORS_PATH, vendorSitePath } from "../../paths";
import { AddOperatorForm } from "./AddOperatorForm";
import { DeleteVendor } from "./DeleteVendor";
import { MembersTable } from "./MembersTable";
import { VendorForm } from "./VendorForm";

const NOT_FOUND = 404;
const CHEVRON_SIZE = 16;
const FORM_SKELETON_HEIGHT = 320;

export default function VendorDetail() {
  const t = useT();
  const { id = "" } = useParams();
  const { data: vendor, error, isPending, refetch } = useVendor(id);

  const back = (
    <Anchor component={Link} to={VENDORS_PATH} size="sm" w="fit-content">
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
        {t("vendor.back")}
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
      <PageHeader
        title={vendor.name}
        actions={
          <Group gap="sm">
            <Anchor href={vendorSitePath(vendor.slug)} size="sm">
              {vendor.slug}
            </Anchor>
            <RoleBadge role={vendor.memberRole} />
          </Group>
        }
      />
      <VendorForm vendor={vendor} />
      <MembersTable vendor={vendor} />
      <AddOperatorForm vendorId={vendor.id} />
      {vendor.canDelete ? <DeleteVendor vendor={vendor} /> : null}
    </Stack>
  );
}
