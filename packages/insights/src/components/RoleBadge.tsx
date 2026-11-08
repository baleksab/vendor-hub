import { Badge } from "@mantine/core";

import { useT } from "../context/MessagesContext";

type Props = { role: "owner" | "operator" };

export function RoleBadge({ role }: Props) {
  const t = useT();

  return (
    <Badge variant="light" color={role === "owner" ? "teal" : "primer"}>
      {t(`role.${role}`)}
    </Badge>
  );
}
