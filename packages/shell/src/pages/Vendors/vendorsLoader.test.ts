import { beforeEach, describe, expect, it, vi } from "vitest";

import { ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./Vendors");

const run = (url = "http://shell.test/vendors") =>
  loader({ request: new Request(url) } as Parameters<typeof loader>[0]);

const categories = ok({
  data: [
    {
      slug: "electronics",
      names: { en: "Electronics", sr: "Elektronika" },
      children: [{ slug: "phones", names: { en: "Phones", sr: "Telefoni" } }],
    },
  ],
});

const vendor = (slug: string) => ({
  slug,
  name: slug,
  description: "d",
  ratingAvg: 4,
  ratingCount: 2,
  productCount: 1,
  categories: ["phones"],
});

const list = (total: number, slugs: string[]) =>
  ok({ data: slugs.map(vendor), meta: { total, limit: 12, offset: 0 } });

const vendorCall = () =>
  api.GET.mock.calls.find(([path]) => path === "/api/v1/vendors") as [
    string,
    { params: { query: unknown } },
  ];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Vendors loader", () => {
  beforeEach(() => {
    api.GET.mockImplementation(async (path: string) => {
      if (path === "/api/v1/categories") {
        return categories;
      }

      return list(30, ["acme", "beta"]);
    });
  });

  it("lists the first page of vendors", async () => {
    const { vendors } = await run();
    const [, options] = vendorCall();

    expect(vendors?.pageCount).toBe(3);
    expect(vendors?.total).toBe(30);
    expect(vendors?.items[0]).toEqual(vendor("acme"));
    expect(options.params.query).toEqual({ limit: 12, offset: 0 });
  });

  it("asks the API for the requested page", async () => {
    await run("http://shell.test/vendors?page=3");

    expect(vendorCall()[1].params.query).toEqual({ limit: 12, offset: 24 });
  });

  it("passes the search, category, rating and sort filters to the API", async () => {
    const { filters } = await run(
      "http://shell.test/vendors?q=acme&category=phones&minRating=4&sort=rating",
    );

    expect(filters).toMatchObject({ q: "acme", category: "phones", minRating: 4, sort: "rating" });
    expect(vendorCall()[1].params.query).toEqual({
      search: "acme",
      category: "phones",
      minRating: 4,
      sort: "rating",
      limit: 12,
      offset: 0,
    });
  });

  it("ignores an unknown category", async () => {
    const { filters } = await run("http://shell.test/vendors?category=nope");

    expect(filters.category).toBeNull();
    expect(vendorCall()[1].params.query).toEqual({ limit: 12, offset: 0 });
  });

  it("redirects a page past the end to the last page, keeping the filters", async () => {
    api.GET.mockImplementation(async (path: string) =>
      path === "/api/v1/categories" ? categories : list(30, []),
    );

    const redirected = await run("http://shell.test/vendors?q=acme&page=9").catch(
      (thrown: Response) => thrown,
    );

    expect(redirected).toBeInstanceOf(Response);
    expect((redirected as Response).status).toBe(302);
    expect((redirected as Response).headers.get("Location")).toBe("/vendors?q=acme&page=3");
  });

  it("still renders the page when the vendor list fails", async () => {
    api.GET.mockReset();
    api.GET.mockRejectedValue(new TypeError("fetch failed"));

    expect(await run()).toMatchObject({ vendors: null, categories: [] });
  });
});
