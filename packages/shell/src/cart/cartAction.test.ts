import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, ok } from "../testing/actions";
import { cartCookie, postForm, readCartCookie } from "../testing/cart";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { cartAction } = await import("./cartAction.server");
const { COOKIE_MAX_BYTES } = await import("./cartSession.server");

const A = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const B = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const URL = `${ORIGIN}/cart`;

type ActionData = {
  data: { ok: boolean; error?: string };
  init: { headers?: Record<string, string>; status?: number };
};

async function act(values: Record<string, string>, cookies: string[] = []) {
  const result = (await cartAction(postForm(URL, values, cookies))) as unknown as ActionData;
  const setCookie = result.init?.headers?.["Set-Cookie"] ?? null;

  return { result, cart: await readCartCookie(setCookie) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("cartAction", () => {
  it("adds a product to an empty cart without calling the API", async () => {
    const { result, cart } = await act({ intent: "add", productId: A, quantity: "2" });

    expect(result.data.ok).toBe(true);
    expect(cart.lines).toEqual([{ productId: A, quantity: 2 }]);
    expect(api.POST).not.toHaveBeenCalled();
  });

  it("merges and clamps to the per line limit", async () => {
    const cookie = await cartCookie({ lines: [{ productId: A, quantity: 8 }] });
    const { cart } = await act({ intent: "add", productId: A, quantity: "5" }, [cookie]);

    expect(cart.lines).toEqual([{ productId: A, quantity: 10 }]);
  });

  it("returns a form error over the line limit", async () => {
    const lines = [
      { productId: A, quantity: 1 },
      { productId: B, quantity: 1 },
      { productId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301", quantity: 1 },
    ];
    const cookie = await cartCookie({ lines });
    const { result } = await act(
      { intent: "add", productId: "9b2c1e4f-6a7d-4c3b-8e1f-2a3b4c5d6e7f", quantity: "1" },
      [cookie],
    );

    expect(result.init.status).toBe(400);
    expect(result.data).toMatchObject({ ok: false, error: "cart.error.tooManyLines" });
  });

  it("sets quantities, removes lines and clears", async () => {
    const cookie = await cartCookie({
      lines: [
        { productId: A, quantity: 1 },
        { productId: B, quantity: 1 },
      ],
    });

    expect(
      (await act({ intent: "setQuantity", productId: A, quantity: "0" }, [cookie])).cart.lines,
    ).toEqual([{ productId: B, quantity: 1 }]);
    expect((await act({ intent: "remove", productId: B }, [cookie])).cart.lines).toEqual([
      { productId: A, quantity: 1 },
    ]);
    expect((await act({ intent: "clear" }, [cookie])).cart.lines).toEqual([]);
  });

  it("reconciles the cart with a fresh quote", async () => {
    const cookie = await cartCookie({ lines: [{ productId: A, quantity: 5 }] });

    api.POST.mockResolvedValueOnce(
      ok({ lines: [{ productId: A, quantity: 2, status: "quantityReduced" }], totals: [] }),
    );

    expect((await act({ intent: "reconcile" }, [cookie])).cart.lines).toEqual([
      { productId: A, quantity: 2 },
    ]);
  });

  it("rejects an unknown intent and a foreign origin", async () => {
    await expect(cartAction(postForm(URL, { intent: "steal" }))).rejects.toMatchObject({
      init: { status: 400 },
    });

    const foreign = new Request(URL, {
      method: "POST",
      headers: { Origin: "http://evil.test", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ intent: "clear" }),
    });

    await expect(cartAction(foreign)).rejects.toMatchObject({ status: 403 });
  });
});

describe("cart cookie size", () => {
  it("stays under 4 KB with a full cart and the longest checkout details", async () => {
    const lines = Array.from({ length: 25 }, () => ({
      productId: crypto.randomUUID(),
      quantity: 99,
    }));
    const cookie = await cartCookie({
      lines,
      checkout: {
        firstName: "x".repeat(100),
        lastName: "x".repeat(100),
        email: `${"a".repeat(240)}@example.com`,
        phoneNumber: "+381601234567890",
        address: "x".repeat(255),
        country: "RS",
      },
      checkoutKey: crypto.randomUUID(),
    });

    expect(new TextEncoder().encode(cookie).byteLength).toBeLessThan(COOKIE_MAX_BYTES);
  });
});
