import { SimpleGrid } from "@mantine/core";

import { useCountryOptions } from "../../hooks/useCountryOptions/useCountryOptions";
import { useT } from "../../i18n/LocaleProvider";
import { FormField } from "../FormField/FormField";

type Props = {
  countries: string[];
  values: Partial<Record<string, string>> | undefined;
  errors: Partial<Record<string, string>> | undefined;
};

export function ContactFields({ countries, values, errors }: Props) {
  const t = useT();
  const options = useCountryOptions(countries);

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <FormField
          name="firstName"
          label={t("auth.firstName")}
          autoComplete="given-name"
          defaultValue={values?.firstName}
          error={errors?.firstName}
        />
        <FormField
          name="lastName"
          label={t("auth.lastName")}
          autoComplete="family-name"
          defaultValue={values?.lastName}
          error={errors?.lastName}
        />
      </SimpleGrid>

      <FormField
        name="email"
        label={t("auth.email")}
        type="email"
        autoComplete="email"
        defaultValue={values?.email}
        error={errors?.email}
      />
      <FormField
        name="phoneNumber"
        label={t("auth.phoneNumber")}
        description={t("auth.phoneHint")}
        type="tel"
        autoComplete="tel"
        defaultValue={values?.phoneNumber}
        error={errors?.phoneNumber}
      />
      <FormField
        name="address"
        label={t("auth.address")}
        autoComplete="street-address"
        defaultValue={values?.address}
        error={errors?.address}
      />
      <FormField
        name="country"
        label={t("auth.country")}
        kind="select"
        options={options}
        placeholder={t("auth.countryPlaceholder")}
        autoComplete="country"
        defaultValue={values?.country}
        error={errors?.country}
      />
    </>
  );
}
