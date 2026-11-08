import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, failure, ok, outcome } from "../../testing/actions";
import { cartCookie, getRequest, postForm, readCartCookie, tokenCookie } from "../../testing/cart";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { checkoutAction } = await import("./checkoutAction.server");
const { loader } = await import("./Checkout");

const A = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const ORDER = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const KEY = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const URL = `${ORIGIN}/checkout`;

const details = {
  firstName: "Bora",
  lastName: "Buyer",
  email: "bora@example.com",
  phoneNumber: "+381601112223",
  address: "Knez Mihailova 1",
  country: "RS",
};

const user = { id: "u1", role: "regular", ...details, firstName: "Profile" };
const quote = {
  lines: [{ productId: A, quantity: 1, status: "ok", product: { vendorId: "v", currency: "EUR" } }],
  totals: [],
  canCheckout: true,
};

function route(loggedIn: boolean) {
  api.GET.mockImplementation(async (path: string) => {
    if (path === "/api/v1/countries") return ok({ data: ["RS", "DE"] });
    if (path === "/api/v1/users/me") return loggedIn ? ok(user) : failure(401, "Unauthorized");

    return failure(404, "Not Found");
  });
}

async function cookies(loggedIn: boolean, extra: Parameters<typeof cartCookie>[0] = {}) {
  const cart = await cartCookie({ lines: [{ productId: A, quantity: 1 }], ...extra });

  return loggedIn ? [cart, await tokenCookie()] : [cart];
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("checkoutAction", () => {
  it("stores the details for a guest and sends them to register", async () => {
    route(false);

    const response = (await checkoutAction(
      postForm(URL, { ...details, idempotencyKey: KEY }, await cookies(false)),
    )) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/register?redirectTo=%2Fcheckout");
    expect((await readCartCookie(response.headers.get("Set-Cookie"))).checkout).toEqual(details);
    expect(api.POST).not.toHaveBeenCalled();
  });

  it("creates the orders for a logged in user and clears the cart", async () => {
    route(true);
    api.POST.mockResolvedValueOnce(ok({ data: [{ id: ORDER }] }, 201));

    const response = (await checkoutAction(
      postForm(
        URL,
        { ...details, idempotencyKey: KEY },
        await cookies(true, { checkout: details }),
      ),
    )) as Response;
    const [, call] = api.POST.mock.calls[0] as [string, { body: Record<string, unknown> }];
    const cart = await readCartCookie(response.headers.get("Set-Cookie"));

    expect(call.body).toEqual({
      lines: [{ productId: A, quantity: 1 }],
      shipping: details,
      idempotencyKey: KEY,
    });
    expect(response.headers.get("Location")).toBe(`/orders/${ORDER}?placed=1`);
    expect(cart).toMatchObject({ lines: [], checkout: null, hasKey: false });
  });

  it("goes to the order list when several orders are created", async () => {
    route(true);
    api.POST.mockResolvedValueOnce(ok({ data: [{ id: ORDER }, { id: KEY }] }, 201));

    const response = (await checkoutAction(
      postForm(URL, { ...details, idempotencyKey: KEY }, await cookies(true)),
    )) as Response;

    expect(response.headers.get("Location")).toBe("/orders?placed=1");
  });

  it("cleans the cart and goes back to it on a 409", async () => {
    route(true);
    api.POST.mockResolvedValueOnce(failure(409, "Conflict")).mockResolvedValueOnce(
      ok({ lines: [{ productId: A, quantity: 0, status: "outOfStock" }], totals: [] }),
    );

    const response = (await checkoutAction(
      postForm(URL, { ...details, idempotencyKey: KEY }, await cookies(true)),
    )) as Response;

    expect(response.headers.get("Location")).toBe("/cart?changed=1");
    expect((await readCartCookie(response.headers.get("Set-Cookie"))).lines).toEqual([]);
  });

  it("validates the shipping details before anything else", async () => {
    route(true);

    const result = (await outcome(
      checkoutAction(
        postForm(URL, { ...details, phoneNumber: "060", idempotencyKey: KEY }, await cookies(true)),
      ),
    )) as { data: { fields: Record<string, string> }; init: { status: number } };

    expect(result.init.status).toBe(400);
    expect(result.data.fields.phoneNumber).toBe("validation.phone");
    expect(api.POST).not.toHaveBeenCalled();
  });
});

describe("Checkout loader", () => {
  const run = async (cookieList: string[]) =>
    (await loader({ request: getRequest(URL, cookieList) } as Parameters<typeof loader>[0])) as {
      data: { defaults: Record<string, string> | null; idempotencyKey: string };
      init: { headers: Record<string, string> };
    };

  beforeEach(() => {
    api.POST.mockResolvedValue(ok(quote));
  });

  it("keeps the same idempotency key across reloads", async () => {
    route(false);

    const first = await run(await cookies(false));
    const cookie = first.init.headers["Set-Cookie"]?.split(";")[0] ?? "";
    const second = await run([cookie]);

    expect(second.data.idempotencyKey).toBe(first.data.idempotencyKey);
  });

  it("prefers the stored checkout details over the profile", async () => {
    route(true);

    expect((await run(await cookies(true, { checkout: details }))).data.defaults).toEqual(details);
    expect((await run(await cookies(true))).data.defaults?.firstName).toBe("Profile");
  });

  it("sends an empty cart back to the cart page", async () => {
    route(false);

    await expect(run([])).rejects.toMatchObject({ status: 302 });
  });
});
