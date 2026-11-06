import { z } from "zod";

import type { ShippingDetails } from "@vendor-hub/types";
import { address, country, email, name, phoneNumber } from "../../forms/fields";

export function createCheckoutSchema(countries: readonly string[]) {
  return z.object({
    firstName: name,
    lastName: name,
    email,
    phoneNumber,
    address,
    country: country(countries),
    idempotencyKey: z.uuid(),
  });
}

export type CheckoutValues = z.output<ReturnType<typeof createCheckoutSchema>>;

export function toShipping(values: CheckoutValues): ShippingDetails {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phoneNumber: values.phoneNumber,
    address: values.address,
    country: values.country as ShippingDetails["country"],
  };
}
