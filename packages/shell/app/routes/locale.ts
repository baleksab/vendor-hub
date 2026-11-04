import { redirect } from "react-router";

import { isLocale } from "../i18n/locales";
import { serializeLocaleCookie } from "../i18n/server";
import type { Route } from "./+types/locale";

function backTo(request: Request): string {
  const referer = request.headers.get("Referer");

  if (!referer) {
    return "/";
  }

  const url = new URL(referer);

  return url.pathname + url.search;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const locale = formData.get("locale");

  if (!isLocale(locale)) {
    throw new Response("Unsupported locale", { status: 400 });
  }

  return redirect(backTo(request), {
    headers: { "Set-Cookie": serializeLocaleCookie(locale) },
  });
}
