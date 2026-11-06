import { beforeEach, describe, expect, it, vi } from "vitest";

import { failure, ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./VendorSite");

const run = (slug: string, query = "") =>
  loader({
    params: { slug },
    request: new Request(`http://shell.test/vendors/${slug}${query}`),
  } as Parameters<typeof loader>[0]);

const vendor = { id: "v1", slug: "acme", name: "Acme", description: "d", members: [] };
const categories = {
  data: [{ slug: "phones", names: { en: "Phones", sr: "Telefoni" }, children: [] }],
};
const products = { data: [], meta: { total: 0, limit: 12, offset: 0 } };

function route() {
  const responses: Record<string, unknown> = {
    "/api/v1/vendors/by-slug/{slug}": vendor,
    "/api/v1/categories": categories,
    "/api/v1/vendors/by-slug/{slug}/products": products,
    "/api/v1/vendors/by-slug/{slug}/product-categories": {
      data: [{ category: "phones", count: 2 }],
    },
    "/api/v1/vendors/by-slug/{slug}/reviews": {
      data: [],
      meta: { total: 0, limit: 50, offset: 0 },
      summary: { ratingAvg: 0, ratingCount: 0, distribution: [0, 0, 0, 0, 0] },
    },
  };

  api.GET.mockImplementation(async (path: string) => ok(responses[path]));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("VendorSite loader", () => {
  it("loads the vendor and its products on the default tab", async () => {
    route();

    const result = await run("acme");

    expect(result).toMatchObject({ vendor, tab: "products", products, reviews: null });
    expect(result.counts).toEqual([{ category: "phones", count: 2 }]);
  });

  it("parses filters from the URL and converts prices to minor units", async () => {
    route();

    await run("acme", "?q=tele&category=phones&minPrice=10&inStock=true&sort=priceAsc&page=2");

    const call = api.GET.mock.calls.find(
      ([path]) => path === "/api/v1/vendors/by-slug/{slug}/products",
    ) as [string, { params: { query: Record<string, unknown> } }];

    expect(call[1].params.query).toEqual({
      q: "tele",
      category: "phones",
      minPrice: 1000,
      inStock: "true",
      sort: "priceAsc",
      limit: 12,
      offset: 12,
    });
  });

  it("falls back on invalid filters instead of throwing", async () => {
    route();

    const result = await run("acme", "?category=nope&minRating=99&page=abc&sort=x");

    expect(result.filters).toMatchObject({ category: null, minRating: null, page: 1, sort: null });
  });

  it("loads reviews only on the reviews tab", async () => {
    route();

    const result = await run("acme", "?tab=reviews");

    expect(result.reviews).not.toBeNull();
    expect(result.products).toBeNull();
  });

  it("answers 404 when the vendor does not exist", async () => {
    api.GET.mockResolvedValueOnce(failure(404, "Not Found"));

    await expect(run("nope")).rejects.toMatchObject({ init: { status: 404 } });
  });
});
