import { describe, expect, it } from "vitest";

import { ORIGIN, form } from "../testing/actions";

const { action } = await import("./logout");

const logout = (request: Request) => action({ request } as Parameters<typeof action>[0]);

describe("logoutAction", () => {
  it("clears the cookie and redirects home", async () => {
    const response = await logout(form({}, `${ORIGIN}/logout`));

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    const cookies = response.headers.getSetCookie();

    expect(cookies[0]).toMatch(/^session=;.*Max-Age=0/);
    expect(cookies[1]).toMatch(/^cart=;.*Expires=Thu, 01 Jan 1970/);
  });

  it("rejects a foreign origin", async () => {
    await expect(logout(form({}, `${ORIGIN}/logout`, "http://evil.test"))).rejects.toMatchObject({
      status: 403,
    });
  });
});
