import { readShellEnv } from "../../env.ts";
import { collectDynamicPaths } from "../seo/dynamicPaths.server";
import { indexablePaths } from "../seo/indexablePages";
import { buildSitemap } from "../seo/sitemap";

export async function loader() {
  const env = readShellEnv(process.env);
  const dynamicPaths = await collectDynamicPaths().catch(() => []);

  return new Response(buildSitemap(env.origin, [...indexablePaths, ...dynamicPaths]), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
