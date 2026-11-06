import { beforeEach, describe, expect, it, vi } from "vitest";

import { failure, ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./ProductPage");

const ID = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const product = { id: ID, vendorSlug: "acme", vendorName: "Acme", images: [], name: "TV" };

const run = (slug: string) =>
  loader({ params: { slug, productId: ID } } as unknown as Parameters<typeof loader>[0]);

beforeEach(() => {
  vi.resetAllMocks();
});

function route() {
  api.GET.mockImplementation(async (path: string) =>
    ok(
      {
        "/api/v1/products/{id}": product,
        "/api/v1/products/{id}/reviews": { data: [], meta: {}, summary: {} },
        "/api/v1/categories": { data: [] },
      }[path],
    ),
  );
}

describe("ProductPage loader", () => {
  it("loads the product, its reviews and the categories", async () => {
    route();

    expect(await run("acme")).toMatchObject({ product, categories: [] });
  });

  it("answers 404 when the product belongs to another vendor", async () => {
    route();

    await expect(run("other")).rejects.toMatchObject({ init: { status: 404 } });
  });

  it("answers 404 when the API does not know the product", async () => {
    api.GET.mockResolvedValue(failure(404, "Not Found"));

    await expect(run("acme")).rejects.toMatchObject({ init: { status: 404 } });
  });
});
