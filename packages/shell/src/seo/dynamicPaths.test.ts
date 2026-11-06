import { beforeEach, describe, expect, it, vi } from "vitest";

import { ok } from "../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { collectDynamicPaths } = await import("./dynamicPaths.server");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("collectDynamicPaths", () => {
  it("lists vendor pages and the product pages of every vendor", async () => {
    api.GET.mockImplementation(async (path: string) => {
      if (path === "/api/v1/vendors") {
        return ok({ data: [{ slug: "acme" }], meta: { total: 1, limit: 100, offset: 0 } });
      }

      return ok({ data: [{ id: "p1" }, { id: "p2" }], meta: { total: 2, limit: 100, offset: 0 } });
    });

    expect(await collectDynamicPaths()).toEqual([
      "/vendors/acme",
      "/vendors/acme/products/p1",
      "/vendors/acme/products/p2",
    ]);
  });
});
