import { readShellEnv, readShellSecrets, type ShellEnv, type ShellSecrets } from "../env.ts";

let cached: (ShellEnv & ShellSecrets) | undefined;

export function getEnv(): ShellEnv & ShellSecrets {
  cached ??= { ...readShellEnv(process.env), ...readShellSecrets(process.env) };

  return cached;
}
