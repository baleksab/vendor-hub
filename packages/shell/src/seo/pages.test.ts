import { describe, expect, it } from "vitest";

import { indexablePages } from "./indexablePages";

const pageModules = import.meta.glob<Record<string, unknown>>("../pages/*/*.tsx");

function pageName(file: string): string {
  return file.split("/").at(-1)!.replace(".tsx", "");
}

describe("pages", () => {
  it("finds the page modules", () => {
    expect(Object.keys(pageModules).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(pageModules))("%s exports meta", async (_file, load) => {
    const module = await load();

    expect(typeof module.meta).toBe("function");
  });

  it.each(indexablePages)("indexable path $path has a page", ({ page }) => {
    const names = Object.keys(pageModules).map(pageName);

    expect(names).toContain(page);
  });
});
