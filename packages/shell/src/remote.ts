import { createInstance, type ModuleFederation } from "@module-federation/runtime";
import * as MantineCore from "@mantine/core";
import * as MantineHooks from "@mantine/hooks";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactRouter from "react-router";

const mantineVersion = MANTINE_VERSION;
const reactRouterVersion = REACT_ROUTER_VERSION;

export type RemoteName = "remote-test" | "user-administrator";

export type RemoteManifestUrls = Record<RemoteName, string>;

let instance: ModuleFederation | undefined;

const modules = new Map<string, Promise<unknown>>();

export function getFederation(manifestUrls: RemoteManifestUrls): ModuleFederation {
  instance ??= createInstance({
    name: "shell",
    remotes: [
      { name: "remote-test", entry: manifestUrls["remote-test"] },
      { name: "user-administrator", entry: manifestUrls["user-administrator"] },
    ],
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
      "react-router": {
        version: reactRouterVersion,
        lib: () => ReactRouter,
        shareConfig: { singleton: true, requiredVersion: reactRouterVersion },
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

export function loadRemoteModule<Module>(
  manifestUrls: RemoteManifestUrls,
  id: string,
): Promise<Module> {
  let promise = modules.get(id) as Promise<Module> | undefined;

  if (!promise) {
    promise = getFederation(manifestUrls)
      .loadRemote<Module>(id)
      .then((module) => {
        if (!module) {
          throw new Error(`${id} not found`);
        }

        return module;
      });
    modules.set(id, promise);
  }

  return promise;
}
