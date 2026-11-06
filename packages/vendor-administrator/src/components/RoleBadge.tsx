import { Badge } from "@mantine/core";
import type { ManagedVendorListItemResponse } from "@vendor-hub/types";

import { useT } from "../context/MessagesContext";

const COLORS = { administrator: "primer", owner: "teal", operator: "gray" } as const;

export function RoleBadge({ role }: { role: ManagedVendorListItemResponse["viewerRole"] }) {
  const t = useT();

  return (
    <Badge variant={role === "administrator" ? "filled" : "light"} color={COLORS[role]}>
      {t(`role.${role}`)}
    </Badge>
  );
}
