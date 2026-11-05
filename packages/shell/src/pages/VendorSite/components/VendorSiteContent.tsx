import { List, Stack, Text, Title } from "@mantine/core";

import type { PublicVendorResponse } from "@vendor-hub/types";
import { useT } from "../../../i18n/LocaleProvider";

export function VendorSiteContent({ vendor }: { vendor: PublicVendorResponse }) {
  const t = useT();

  return (
    <Stack component="section" gap="lg" py={{ base: "lg", sm: "xl" }} maw={720}>
      <Stack gap="xs">
        <Title order={1} fz={{ base: 32, sm: 44 }}>
          {vendor.name}
        </Title>
        <Text c="dimmed" fz={{ base: "md", sm: "lg" }} style={{ whiteSpace: "pre-line" }}>
          {vendor.description}
        </Text>
      </Stack>

      <Stack gap="xs" component="section" aria-labelledby="vendor-members">
        <Title order={2} id="vendor-members" fz="lg">
          {t("vendor.members")}
        </Title>
        <List listStyleType="none" spacing="xs">
          {vendor.members.map((member) => (
            <List.Item key={`${member.firstName} ${member.lastName} ${member.role}`}>
              {member.firstName} {member.lastName}{" "}
              <Text span c="dimmed">
                ({t(member.role === "owner" ? "vendor.role.owner" : "vendor.role.operator")})
              </Text>
            </List.Item>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}
