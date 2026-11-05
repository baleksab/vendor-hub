import { beforeEach, describe, expect, it, vi } from "vitest";

import { ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./Vendors");

const run = (url = "http://shell.test/vendors") =>
  loader({ request: new Request(url) } as Parameters<typeof loader>[0]);

const list = (total: number, slugs: string[]) =>
  ok({
    data: slugs.map((slug) => ({ slug, name: slug, description: "d" })),
    meta: { total, limit: 12, offset: 0 },
  });

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Vendors loader", () => {
  it("lists the first page of vendors", async () => {
    api.GET.mockResolvedValueOnce(list(30, ["acme", "beta"]));

    const { vendors } = await run();
    const [path, options] = api.GET.mock.calls[0] as [string, { params: { query: unknown } }];

    expect(vendors?.pageCount).toBe(3);
    expect(vendors?.items[0]).toEqual({ slug: "acme", name: "acme", description: "d" });
    expect(path).toBe("/api/v1/vendors");
    expect(options.params.query).toEqual({ limit: 12, offset: 0 });
  });

  it("asks the API for the requested page", async () => {
    api.GET.mockResolvedValueOnce(list(30, ["acme"]));

    await run("http://shell.test/vendors?page=3");

    const [, options] = api.GET.mock.calls[0] as [string, { params: { query: unknown } }];

    expect(options.params.query).toEqual({ limit: 12, offset: 24 });
  });

  it("redirects a page past the end to the last page", async () => {
    api.GET.mockResolvedValueOnce(list(30, []));

    await expect(run("http://shell.test/vendors?page=9")).rejects.toMatchObject({
      status: 302,
    });
  });

  it("still renders the page when the vendor list fails", async () => {
    api.GET.mockRejectedValueOnce(new TypeError("fetch failed"));

    expect(await run()).toEqual({ vendors: null });
  });
});
