import type { ComponentType } from "react";

import { getFederation } from "../../remote";

export type WidgetModule = { default: ComponentType };

const modules = new Map<string, Promise<WidgetModule>>();

export function loadWidget(manifestUrl: string): Promise<WidgetModule> {
  let promise = modules.get(manifestUrl);

  if (!promise) {
    promise = getFederation(manifestUrl)
      .loadRemote<WidgetModule>("remote-test/Widget")
      .then((module) => {
        if (!module) {
          throw new Error("remote-test/Widget not found");
        }

        return module;
      });
    modules.set(manifestUrl, promise);
  }

  return promise;
}
