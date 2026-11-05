import { readShellEnv, type ShellEnv } from "../env.ts";

let cached: ShellEnv | undefined;

export function getEnv(): ShellEnv {
  cached ??= readShellEnv(process.env);

  return cached;
}
