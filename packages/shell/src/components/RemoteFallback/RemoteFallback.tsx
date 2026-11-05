import { PageSpinner } from "@vendor-hub/ui";

import { useT } from "../../i18n/LocaleProvider";

export function RemoteFallback() {
  const t = useT();

  return <PageSpinner label={t("remote.loading")} />;
}
