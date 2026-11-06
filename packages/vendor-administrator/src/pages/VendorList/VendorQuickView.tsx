import { Anchor, Button, Drawer, Stack, Text } from "@mantine/core";
import type { ManagedVendorListItemResponse } from "@vendor-hub/types";
import { Link } from "react-router";

import { RoleBadge } from "../../components/RoleBadge";
import { useLocale } from "../../context/LocaleContext";
import { useT } from "../../context/MessagesContext";
import { vendorPath, vendorSitePath } from "../../paths";

type Props = {
  vendor: ManagedVendorListItemResponse | null;
  onClose: () => void;
};

export function VendorQuickView({ vendor, onClose }: Props) {
  const t = useT();
  const locale = useLocale();
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <Drawer
      opened={vendor !== null}
      onClose={onClose}
      position="right"
      title={vendor?.name}
      closeButtonProps={{ "aria-label": t("common.close") }}
    >
      {vendor === null ? null : (
        <Stack gap="md">
          <Anchor href={vendorSitePath(vendor.slug)} size="sm">
            {t("quick.site")}: {vendor.slug}
          </Anchor>
          <Field label={t("quick.description")} value={vendor.description} />
          <Field
            label={t("quick.owner")}
            value={`${vendor.owner.firstName} ${vendor.owner.lastName}`}
          />
          <Field label={t("quick.users")} value={String(vendor.memberCount)} />
          <Field label={t("quick.created")} value={dateFormat.format(new Date(vendor.createdAt))} />
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {t("quick.role")}
            </Text>
            <RoleBadge role={vendor.viewerRole} />
          </div>
          <Button component={Link} to={vendorPath(vendor.id)} size="md">
            {t("quick.manage")}
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </div>
  );
}
