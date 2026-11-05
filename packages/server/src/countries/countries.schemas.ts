import { z } from "zod";

export const CountryListResponse = z
  .object({ data: z.array(z.string()) })
  .meta({ id: "CountryListResponse" });

export type CountryListResponse = z.infer<typeof CountryListResponse>;
