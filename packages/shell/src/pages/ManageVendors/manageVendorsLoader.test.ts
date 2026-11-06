import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, TOKEN, ok } from "../../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loader } = await import("./ManageVendors");
const { commitToken } = await import("../../auth/sessionCookie.server");

const user = (role: string) => ok({ id: "1", role, firstName: "A", lastName: "B" });

async function run(withCookie = true) {
  const headers = new Headers();

  if (withCookie) {
    headers.set("Cookie", (await commitToken(TOKEN, 60)).split(";")[0] ?? "");
  }

  return loader({
    request: new Request(`${ORIGIN}/manage/vendors`, { headers }),
  } as Parameters<typeof loader>[0]);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ManageVendors loader", () => {
  it("redirects to login without a session", async () => {
    const thrown = await run(false).catch((error: Response) => error);

    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get("Location")).toBe(
      "/login?redirectTo=%2Fmanage%2Fvendors",
    );
  });

  it.each(["regular", "administrator"])("lets a %s user through", async (role) => {
    api.GET.mockResolvedValueOnce(user(role));

    await expect(run()).resolves.toBeNull();
  });
});
