import { beforeEach, describe, expect, it, vi } from "vitest";

import { failure, ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./VendorSite");

const run = (slug: string) => loader({ params: { slug } } as Parameters<typeof loader>[0]);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("VendorSite loader", () => {
  it("loads the public vendor by slug", async () => {
    const vendor = { slug: "acme", name: "Acme", description: "d", members: [] };

    api.GET.mockResolvedValueOnce(ok(vendor));

    expect(await run("acme")).toEqual({ vendor });

    const [path, options] = api.GET.mock.calls[0] as [string, { params: { path: unknown } }];

    expect(path).toBe("/api/v1/vendors/by-slug/{slug}");
    expect(options.params.path).toEqual({ slug: "acme" });
  });

  it("answers 404 when the vendor does not exist", async () => {
    api.GET.mockResolvedValueOnce(failure(404, "Not Found"));

    await expect(run("nope")).rejects.toMatchObject({ init: { status: 404 } });
  });
});
