import { beforeEach, describe, expect, it, vi } from "vitest";

import { authedForm, ok, outcome } from "../../testing/actions";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { paymentAction } = await import("./paymentAction.server");

const ID = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const URL = `http://shell.test/orders/${ID}/pay`;

const pay = async (cardNumber: string) =>
  outcome(paymentAction(await authedForm({ cardNumber }, URL), ID));

beforeEach(() => {
  vi.resetAllMocks();
  api.GET.mockResolvedValue(ok({ id: "u1", role: "regular" }));
});

describe("paymentAction", () => {
  it("goes to the order after a successful payment", async () => {
    api.POST.mockResolvedValueOnce(
      ok({ order: { status: "paid" }, payment: { status: "succeeded", attemptsLeft: 3 } }),
    );

    const response = (await pay("4242 4242 4242 4242")) as Response;
    const [, call] = api.POST.mock.calls[0] as [string, { body: { cardNumber: string } }];

    expect(response.headers.get("Location")).toBe(`/orders/${ID}?paid=1`);
    expect(call.body.cardNumber).toBe("4242424242424242");
  });

  it("shows the failed outcome with the attempts left", async () => {
    api.POST.mockResolvedValueOnce(
      ok({
        order: { status: "created" },
        payment: { status: "failed", failureReason: "declined", attemptsLeft: 2 },
      }),
    );

    expect(await pay("4000000000000002")).toEqual({
      outcome: "failed",
      reason: "declined",
      attemptsLeft: 2,
    });
  });

  it("reports a cancelled order after the last attempt", async () => {
    api.POST.mockResolvedValueOnce(
      ok({
        order: { status: "cancelled" },
        payment: { status: "failed", failureReason: "declined", attemptsLeft: 0 },
      }),
    );

    expect(await pay("4000000000000002")).toMatchObject({ outcome: "cancelled" });
  });

  it("validates the card number without echoing it back", async () => {
    const result = (await pay("12ab")) as {
      data: { fields: Record<string, string>; values: Record<string, string> };
    };

    expect(result.data.fields.cardNumber).toBe("payment.validation.card");
    expect(result.data.values).toEqual({});
    expect(api.POST).not.toHaveBeenCalled();
  });
});
