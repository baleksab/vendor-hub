import { describe, expect, it, vi } from "vitest";

import { ORIGIN } from "../testing/actions";
import { cartCookie, getRequest } from "../testing/cart";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("../root");

describe("root loader", () => {
  it("returns the cart count from the cookie without calling the API", async () => {
    const cookie = await cartCookie({
      lines: [
        { productId: "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11", quantity: 2 },
        { productId: "7c9e6679-7425-40de-944b-e07fc1f90ae7", quantity: 3 },
      ],
    });

    const result = (await loader({
      request: getRequest(ORIGIN, [cookie]),
    } as unknown as Parameters<typeof loader>[0])) as { data: { cartCount: number } };

    expect(result.data.cartCount).toBe(5);
    expect(api.GET).not.toHaveBeenCalled();
    expect(api.POST).not.toHaveBeenCalled();
  });
});
