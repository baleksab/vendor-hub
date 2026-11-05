import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, authedForm, failure, form, ok, outcome } from "../../testing/actions";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn(), DELETE: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { becomeVendorAction } = await import("./becomeVendorAction.server");

const values = { slug: "Acme", name: "Acme Inc", description: "We sell everything you need." };
const url = `${ORIGIN}/become-vendor`;

beforeEach(() => {
  vi.resetAllMocks();
  api.GET.mockResolvedValue(ok({ id: "u1" }));
});

describe("becomeVendorAction", () => {
  it("registers the vendor with the token and redirects to its site", async () => {
    api.POST.mockResolvedValueOnce(ok({ id: "v1", slug: "acme" }, 201));

    const response = (await becomeVendorAction(await authedForm(values, url))) as Response;
    const [path, call] = api.POST.mock.calls[0] as [string, { body: Record<string, string> }];

    expect(response.headers.get("Location")).toBe("/vendors/acme");
    expect(path).toBe("/api/v1/vendors");
    expect(call.body).toEqual({ ...values, slug: "acme" });
  });

  it("sends an anonymous user to the login page", async () => {
    const response = await becomeVendorAction(form(values, url)).catch((thrown) => thrown);

    expect(response.headers.get("Location")).toBe("/login?redirectTo=%2Fbecome-vendor");
    expect(api.POST).not.toHaveBeenCalled();
  });

  it("rejects a foreign origin", async () => {
    await expect(
      becomeVendorAction(await authedForm(values, url, "http://evil.test")),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("validates before calling the API", async () => {
    const result = (await outcome(
      becomeVendorAction(await authedForm({ ...values, slug: "-x" }, url)),
    )) as { data: { fields: Record<string, string> }; init: ResponseInit };

    expect(result.init.status).toBe(400);
    expect(result.data.fields.slug).toBe("validation.slug");
    expect(api.POST).not.toHaveBeenCalled();
  });

  it("puts a slug conflict on the slug field", async () => {
    api.POST.mockResolvedValueOnce(failure(409, "Conflict"));

    const result = (await outcome(becomeVendorAction(await authedForm(values, url)))) as {
      data: { fields: Record<string, string>; values: Record<string, string> };
    };

    expect(result.data.fields).toEqual({ slug: "vendor.error.slugTaken" });
    expect(result.data.values.name).toBe("Acme Inc");
  });
});
