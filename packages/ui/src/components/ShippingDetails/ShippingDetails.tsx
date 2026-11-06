import { Stack, Text } from "@mantine/core";

type Props = {
  details: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  countryName: string;
};

export function ShippingDetails({ details, countryName }: Props) {
  return (
    <Stack gap={2} component="address" style={{ fontStyle: "normal" }}>
      <Text fw={600}>
        {details.firstName} {details.lastName}
      </Text>
      <Text>{details.address}</Text>
      <Text>{countryName}</Text>
      <Text size="sm" c="dimmed">
        {details.email}
      </Text>
      <Text size="sm" c="dimmed">
        {details.phoneNumber}
      </Text>
    </Stack>
  );
}
