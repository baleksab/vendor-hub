import { beforeEach, describe, expect, it, vi } from "vitest";

import { failure, ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./Home");

const run = (headers: Record<string, string> = {}) =>
  loader({ request: new Request("http://acme.vendors.test/", { headers }) } as Parameters<
    typeof loader
  >[0]);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Home loader", () => {
  it("returns no vendor site on the main site", async () => {
    expect(await run()).toEqual({ vendorSite: null });
    expect(api.GET).not.toHaveBeenCalled();
  });

  it("loads the public vendor for an anonymous visitor", async () => {
    const vendor = { slug: "acme", name: "Acme", description: "d", members: [] };

    api.GET.mockResolvedValueOnce(ok(vendor));

    expect(await run({ "X-Vendor-Slug": "acme" })).toEqual({ vendorSite: vendor });

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
