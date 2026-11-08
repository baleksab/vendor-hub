import { Badge } from "@mantine/core";
import type { VendorResponse } from "@vendor-hub/types";

import { useT } from "../context/MessagesContext";

type Props = { role: VendorResponse["memberRole"] };

export function RoleBadge({ role }: Props) {
  const t = useT();

  if (role === null) {
    return (
      <Badge variant="light" color="gray">
        {t("role.none")}
      </Badge>
    );
  }

  return (
    <Badge variant="light" color={role === "owner" ? "teal" : "brand"}>
      {t(`role.${role}`)}
    </Badge>
  );
}
