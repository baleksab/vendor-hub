import { describe, expect, it } from "vitest";

import {
  addLine,
  countItems,
  parseLines,
  reconcile,
  removeLine,
  serializeLines,
  setQuantity,
} from "./cartLines";

const limits = { maxLines: 2, maxQuantityPerLine: 5 };
const A = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const B = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const C = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("cart lines", () => {
  it("merges an existing product and clamps the quantity", () => {
    const first = addLine([], A, 3, limits);
    const second = first.ok ? addLine(first.lines, A, 4, limits) : first;

    expect(second).toEqual({ ok: true, lines: [{ productId: A, quantity: 5 }] });
  });

  it("refuses a new product over the line limit", () => {
    const lines = [
      { productId: A, quantity: 1 },
      { productId: B, quantity: 1 },
    ];

    expect(addLine(lines, C, 1, limits)).toEqual({ ok: false, reason: "tooManyLines" });
    expect(addLine(lines, A, 1, limits).ok).toBe(true);
  });

  it("removes a line when the quantity is set to 0", () => {
    const lines = [{ productId: A, quantity: 2 }];

    expect(setQuantity(lines, A, 0, limits)).toEqual([]);
    expect(setQuantity(lines, A, 9, limits)).toEqual([{ productId: A, quantity: 5 }]);
    expect(removeLine(lines, A)).toEqual([]);
  });

  it("counts the items", () => {
    expect(
      countItems([
        { productId: A, quantity: 2 },
        { productId: B, quantity: 3 },
      ]),
    ).toBe(5);
  });

  it("round trips through serialization", () => {
    const lines = [{ productId: A, quantity: 2 }];

    expect(parseLines(serializeLines(lines), limits)).toEqual(lines);
  });

  it.each([
    null,
    "garbage",
    { v: 2, lines: [{ productId: A, quantity: 1 }] },
    { v: 1, lines: [{ productId: "nope", quantity: 1 }] },
    { v: 1, lines: [{ productId: A, quantity: 0 }] },
  ])("treats %j as an empty cart", (value) => {
    expect(parseLines(value, limits)).toEqual([]);
  });

  it("applies the limits to a tampered cookie", () => {
    const value = {
      v: 1,
      lines: [
        { productId: A, quantity: 500 },
        { productId: B, quantity: 1 },
        { productId: C, quantity: 1 },
      ],
    };

    expect(parseLines(value, limits)).toEqual([
      { productId: A, quantity: 5 },
      { productId: B, quantity: 1 },
    ]);
  });

  it("reconciles with a quote", () => {
    const lines = [
      { productId: A, quantity: 4 },
      { productId: B, quantity: 1 },
      { productId: C, quantity: 1 },
    ];

    expect(
      reconcile(lines, [
        { productId: A, quantity: 2, status: "quantityReduced" },
        { productId: B, quantity: 0, status: "outOfStock" },
        { productId: C, quantity: 1, status: "ok" },
      ]),
    ).toEqual([
      { productId: A, quantity: 2 },
      { productId: C, quantity: 1 },
    ]);
  });
});
