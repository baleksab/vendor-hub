import { createInstance, type ModuleFederation } from "@module-federation/runtime";
import * as MantineCore from "@mantine/core";
import * as MantineHooks from "@mantine/hooks";
import * as React from "react";
import * as ReactDOM from "react-dom";

const mantineVersion = MANTINE_VERSION;

let instance: ModuleFederation | undefined;

export function getFederation(manifestUrl: string): ModuleFederation {
  instance ??= createInstance({
    name: "shell",
    remotes: [{ name: "remote-test", entry: manifestUrl }],
    shared: {
      react: {
        version: React.version,
        lib: () => React,
        shareConfig: { singleton: true, requiredVersion: `^${React.version}` },
      },
      "react-dom": {
        version: React.version,
        lib: () => ReactDOM,
        shareConfig: { singleton: true, requiredVersion: `^${React.version}` },
      },
      "@mantine/core": {
        version: mantineVersion,
        lib: () => MantineCore,
        shareConfig: { singleton: true, requiredVersion: `^${mantineVersion}` },
      },
      "@mantine/hooks": {
        version: mantineVersion,
        lib: () => MantineHooks,
        shareConfig: { singleton: true, requiredVersion: `^${mantineVersion}` },
      },
    },
  });

  return instance;
}
