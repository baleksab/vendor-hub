import { describe, expect, it } from "vitest";

import { createT } from "./index";
import { en } from "./messages/en";
import { sr } from "./messages/sr";

describe("createT", () => {
  it("returns the string for the given locale", () => {
    expect(createT("en")("nav.home")).toBe(en["nav.home"]);
    expect(createT("sr")("nav.home")).toBe(sr["nav.home"]);
  });

  it("has the same keys in en and sr", () => {
    expect(Object.keys(sr).sort()).toEqual(Object.keys(en).sort());
  });
});
