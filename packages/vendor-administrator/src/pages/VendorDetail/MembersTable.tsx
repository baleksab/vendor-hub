import { Alert, Button, Paper, Stack, Table, Text, Title } from "@mantine/core";
import type { VendorResponse } from "@vendor-hub/types";
import { useState } from "react";

import { RoleBadge } from "../../components/RoleBadge";
import { useT } from "../../context/MessagesContext";
import { useRemoveOperator } from "../../hooks/useRemoveOperator";

export function MembersTable({ vendor }: { vendor: VendorResponse }) {
  const t = useT();
  const mutation = useRemoveOperator(vendor.id);
  const [failed, setFailed] = useState(false);

  const handleRemove = async (userId: string) => {
    setFailed(false);

    try {
      await mutation.mutateAsync(userId);
    } catch {
      setFailed(true);
    }
  };

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={2} size="h4">
            {t("members.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("members.description")}
          </Text>
        </div>

        <Table.ScrollContainer minWidth={320}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("members.col.name")}</Table.Th>
                <Table.Th>{t("members.col.role")}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vendor.members.map((member) => {
                const name = `${member.firstName} ${member.lastName}`;

                return (
                  <Table.Tr key={member.userId}>
                    <Table.Td>{name}</Table.Td>
                    <Table.Td>
                      <RoleBadge role={member.role} />
                    </Table.Td>
                    <Table.Td ta="right">
                      {member.role === "operator" ? (
                        <Button
                          variant="default"
                          color="red"
                          size="xs"
                          aria-label={t("members.removeLabel", { name })}
                          loading={mutation.isPending && mutation.variables === member.userId}
                          onClick={() => void handleRemove(member.userId)}
                        >
                          {t("members.remove")}
                        </Button>
                      ) : null}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {failed ? (
          <Alert color="red" role="alert">
            {t("members.removeFailed")}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}
