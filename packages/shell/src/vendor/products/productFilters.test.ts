import { describe, expect, it } from "vitest";

import { parseProductFilters, toApiQuery, toSearchParams } from "./productFilters";

const categories = new Set(["electronics", "phones"]);
const parse = (query: string) => parseProductFilters(new URLSearchParams(query), categories);

describe("parseProductFilters", () => {
  it("reads valid values", () => {
    expect(
      parse(
        "q=tele&category=phones&minRating=4&minPrice=10&maxPrice=50&inStock=true&sort=priceAsc&page=3",
      ),
    ).toEqual({
      q: "tele",
      category: "phones",
      minRating: 4,
      minPrice: 10,
      maxPrice: 50,
      inStock: true,
      sort: "priceAsc",
      page: 3,
    });
  });

  it("falls back on invalid values instead of throwing", () => {
    expect(
      parse("q=%20&category=nope&minRating=9&minPrice=-1&maxPrice=abc&inStock=maybe&sort=x&page=0"),
    ).toEqual({
      q: null,
      category: null,
      minRating: null,
      minPrice: null,
      maxPrice: null,
      inStock: false,
      sort: null,
      page: 1,
    });
  });
});

describe("toApiQuery", () => {
  it("converts prices to minor units and the page to an offset", () => {
    const query = toApiQuery(parse("minPrice=10&maxPrice=50&inStock=true&page=2&category=phones"));

    expect(query).toMatchObject({
      minPrice: 1000,
      maxPrice: 5000,
      inStock: "true",
      category: "phones",
      limit: 12,
      offset: 12,
    });
  });

  it("round-trips through the search params", () => {
    const filters = parse("q=tele&minRating=3&page=2");

    expect(toSearchParams(filters).toString()).toBe("q=tele&minRating=3&page=2");
  });
});
