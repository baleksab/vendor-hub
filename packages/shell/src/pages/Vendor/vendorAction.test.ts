import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, authedForm, failure, ok, outcome } from "../../testing/actions";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn(), DELETE: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { vendorAction } = await import("./vendorAction.server");

const url = `${ORIGIN}/vendor`;
const userId = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";

beforeEach(() => {
  vi.resetAllMocks();
  api.GET.mockResolvedValue(ok({ id: "u1" }));
});

describe("vendorAction", () => {
  it("adds an operator by email", async () => {
    api.POST.mockResolvedValueOnce(ok({ id: "v1" }, 201));

    const response = (await vendorAction(
      await authedForm({ intent: "add", email: " Op@Example.com " }, url),
    )) as Response;
    const [path, call] = api.POST.mock.calls[0] as [string, { body: unknown }];

    expect(response.headers.get("Location")).toBe("/vendor");
    expect(path).toBe("/api/v1/vendors/me/operators");
    expect(call.body).toEqual({ email: "op@example.com" });
  });

  it("puts an unknown user and a duplicate member on the email field", async () => {
    api.POST.mockResolvedValueOnce(failure(404, "Not Found"));
    api.POST.mockResolvedValueOnce(failure(409, "Conflict"));
    const request = () => authedForm({ intent: "add", email: "op@example.com" }, url);

    const missing = (await outcome(vendorAction(await request()))) as {
      data: { fields: Record<string, string> };
    };
    const duplicate = (await outcome(vendorAction(await request()))) as {
      data: { fields: Record<string, string> };
    };

    expect(missing.data.fields).toEqual({ email: "vendor.error.userNotFound" });
    expect(duplicate.data.fields).toEqual({ email: "vendor.error.alreadyMember" });
  });

  it("removes an operator", async () => {
    api.DELETE.mockResolvedValueOnce(ok(null, 204));

    const response = (await vendorAction(
      await authedForm({ intent: "remove", userId }, url),
    )) as Response;
    const [path, call] = api.DELETE.mock.calls[0] as [
      string,
      { params: { path: { userId: string } } },
    ];

    expect(response.headers.get("Location")).toBe("/vendor");
    expect(path).toBe("/api/v1/vendors/me/operators/{userId}");
    expect(call.params.path.userId).toBe(userId);
  });

  it("rejects an invalid user id without calling the API", async () => {
    const result = (await outcome(
      vendorAction(await authedForm({ intent: "remove", userId: "nope" }, url)),
    )) as { init: ResponseInit };

    expect(result.init.status).toBe(400);
    expect(api.DELETE).not.toHaveBeenCalled();
  });

  it("rejects an unknown intent and a foreign origin", async () => {
    await expect(vendorAction(await authedForm({ intent: "x" }, url))).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      vendorAction(await authedForm({ intent: "add" }, url, "http://evil.test")),
    ).rejects.toMatchObject({ status: 403 });
  });
});
