import { z } from "zod";

export const CheckoutDetailsSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  address: z.string(),
  country: z.string(),
});

export type CheckoutDetails = z.infer<typeof CheckoutDetailsSchema>;

export const CHECKOUT_FIELDS = Object.keys(
  CheckoutDetailsSchema.shape,
) as (keyof CheckoutDetails)[];
