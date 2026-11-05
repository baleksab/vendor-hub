import { beforeEach, describe, expect, it, vi } from "vitest";

import { failure, ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./Home");

type VendorPage = import("../../vendor/vendorList.server").VendorPage;

const run = (headers: Record<string, string> = {}) =>
  loader({ request: new Request("http://acme.vendors.test/", { headers }) } as Parameters<
    typeof loader
  >[0]);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Home loader", () => {
  const list = (total: number, slugs: string[]) =>
    ok({
      data: slugs.map((slug) => ({ slug, name: slug, description: "d" })),
      meta: { total, limit: 12, offset: 0 },
    });

  it("lists the vendors on the main site with links to their sites", async () => {
    api.GET.mockResolvedValueOnce(list(30, ["acme", "beta"]));

    const result = (await run()) as { vendorSite: null; vendors: VendorPage };
    const [path, options] = api.GET.mock.calls[0] as [string, { params: { query: unknown } }];

    expect(result.vendorSite).toBeNull();
    expect(result.vendors.pageCount).toBe(3);
    expect(result.vendors.items[0]).toMatchObject({
      slug: "acme",
      siteUrl: "http://acme.vendors.test",
    });
    expect(path).toBe("/api/v1/vendors");
    expect(options.params.query).toEqual({ limit: 12, offset: 0 });
  });

  it("asks the API for the requested page", async () => {
    api.GET.mockResolvedValueOnce(list(30, ["acme"]));

    await loader({
      request: new Request("http://shell.test/?page=3"),
    } as Parameters<typeof loader>[0]);

    const [, options] = api.GET.mock.calls[0] as [string, { params: { query: unknown } }];

    expect(options.params.query).toEqual({ limit: 12, offset: 24 });
  });

  it("redirects a page past the end to the last page", async () => {
    api.GET.mockResolvedValueOnce(list(30, []));

    await expect(
      loader({ request: new Request("http://shell.test/?page=9") } as Parameters<typeof loader>[0]),
    ).rejects.toMatchObject({ status: 302 });
  });

  it("still renders the landing page when the vendor list fails", async () => {
    api.GET.mockRejectedValueOnce(new TypeError("fetch failed"));

    expect(await run()).toEqual({ vendorSite: null, vendors: null });
  });

  it("loads the public vendor for an anonymous visitor", async () => {
    const vendor = { slug: "acme", name: "Acme", description: "d", members: [] };

    api.GET.mockResolvedValueOnce(ok(vendor));

    expect(await run({ "X-Vendor-Slug": "acme" })).toEqual({ vendorSite: vendor, vendors: null });

    const [path, options] = api.GET.mock.calls[0] as [string, { params: { path: unknown } }];

    expect(path).toBe("/api/v1/vendors/by-slug/{slug}");
    expect(options.params.path).toEqual({ slug: "acme" });
  });

  it("answers 404 when the vendor does not exist", async () => {
    api.GET.mockResolvedValueOnce(failure(404, "Not Found"));

    await expect(run({ "X-Vendor-Slug": "nope" })).rejects.toMatchObject({
      init: { status: 404 },
    });
  });
});
