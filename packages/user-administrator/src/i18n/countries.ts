import type { Locale } from "@vendor-hub/types";

export function createCountryName(locale: Locale): (code: string) => string {
  const names = new Intl.DisplayNames([locale], { type: "region" });

  return (code) => {
    try {
      return names.of(code) ?? code;
    } catch {
      return code;
    }
  };
}
