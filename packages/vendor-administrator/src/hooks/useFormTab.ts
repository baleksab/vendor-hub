import { useSearchParams } from "react-router";

export type FormTab = "details" | "seo";

const TAB_PARAM = "tab";

export function useFormTab(): [FormTab, (tab: string | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: FormTab = searchParams.get(TAB_PARAM) === "seo" ? "seo" : "details";

  const setTab = (next: string | null) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);

        if (next === "seo") {
          params.set(TAB_PARAM, next);
        } else {
          params.delete(TAB_PARAM);
        }

        return params;
      },
      { replace: true },
    );
  };

  return [tab, setTab];
}
