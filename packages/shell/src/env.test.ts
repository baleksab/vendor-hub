import { describe, expect, it } from "vitest";

import { readShellEnv, readShellSecrets } from "../env";

const base = {
  DEFAULT_LOCALE: "en",
  SHELL_HOST: "localhost",
  SHELL_PORT: "4100",
  SHELL_ORIGIN: "http://shell.test",
  USER_ADMINISTRATOR_MANIFEST_URL: "http://admin.test/mf-manifest.json",
  VENDOR_ADMINISTRATOR_MANIFEST_URL: "http://manage.test/mf-manifest.json",
  API_URL: "http://api.test",
  SESSION_COOKIE_NAME: "session",
  SESSION_COOKIE_SECURE: "true",
  CART_COOKIE_NAME: "cart",
  CART_MAX_LINES: "25",
  CART_MAX_QUANTITY_PER_LINE: "99",
};

describe("shell env", () => {
  it("reads the cart settings", () => {
    expect(readShellEnv(base)).toMatchObject({
      cartCookieName: "cart",
      cartMaxLines: 25,
      cartMaxQuantityPerLine: 99,
    });
  });

  it.each(["CART_COOKIE_NAME", "CART_MAX_LINES", "CART_MAX_QUANTITY_PER_LINE"])(
    "throws without %s",
    (key) => {
      expect(() => readShellEnv({ ...base, [key]: "" })).toThrow(key);
    },
  );

  it("rejects a limit that is not a positive integer", () => {
    expect(() => readShellEnv({ ...base, CART_MAX_LINES: "0" })).toThrow(/positive integer/);
  });

  it("needs a long enough session secret", () => {
    expect(() => readShellSecrets({})).toThrow("SHELL_SESSION_SECRET");
    expect(() => readShellSecrets({ SHELL_SESSION_SECRET: "short" })).toThrow(/32 bytes/);
    expect(readShellSecrets({ SHELL_SESSION_SECRET: "x".repeat(32) }).sessionSecret).toHaveLength(
      32,
    );
  });
});
