import { readShellEnv } from "../../env.ts";
import { buildRobots } from "../seo/robots";

export function loader() {
  const env = readShellEnv(process.env);

  return new Response(buildRobots(env.origin), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
