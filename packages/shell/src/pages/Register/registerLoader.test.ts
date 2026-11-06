import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, ok } from "../../testing/actions";
import { cartCookie, getRequest } from "../../testing/cart";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./Register");

const details = {
  firstName: "Bora",
  lastName: "Buyer",
  email: "bora@example.com",
  phoneNumber: "+381601112223",
  address: "Knez Mihailova 1",
  country: "RS",
};

const run = (cookies: string[]) =>
  loader({ request: getRequest(`${ORIGIN}/register?redirectTo=/checkout`, cookies) } as Parameters<
    typeof loader
  >[0]);

beforeEach(() => {
  vi.resetAllMocks();
  api.GET.mockResolvedValue(ok({ data: ["RS"] }));
});

describe("Register loader", () => {
  it("prefills the stored checkout details and never a password", async () => {
    const result = await run([await cartCookie({ checkout: details })]);

    expect(result.checkout).toEqual(details);
    expect(JSON.stringify(result)).not.toMatch(/password/i);
  });

  it("has nothing to prefill without a checkout", async () => {
    expect((await run([])).checkout).toBeNull();
  });
});
