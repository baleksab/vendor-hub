import { readShellEnv } from "../../env.ts";
import { indexablePaths } from "../seo/indexablePages";
import { buildSitemap } from "../seo/sitemap";

export function loader() {
  const env = readShellEnv(process.env);

  return new Response(buildSitemap(env.origin, indexablePaths), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
