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

describe("plural messages", () => {
  it("picks the plural form of the locale", () => {
    expect(createT("en")("vendors.count", { count: 1 })).toBe("1 vendor");
    expect(createT("en")("vendors.count", { count: 2 })).toBe("2 vendors");
    expect(createT("sr")("products.count", { count: 1 })).toBe("1 proizvod");
    expect(createT("sr")("products.count", { count: 3 })).toBe("3 proizvoda");
    expect(createT("sr")("products.count", { count: 5 })).toBe("5 proizvoda");
    expect(createT("sr")("vendors.count", { count: 21 })).toBe("21 prodavac");
    expect(createT("sr")("vendors.count", { count: 24 })).toBe("24 prodavca");
  });
});
