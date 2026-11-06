import { describe, expect, it } from "vitest";

import { parseVendorFilters, toVendorApiQuery, toVendorSearchParams } from "./vendorFilters";

const known = new Set(["electronics", "phones"]);
const parse = (query: string) => parseVendorFilters(new URLSearchParams(query), known);

describe("parseVendorFilters", () => {
  it("returns defaults for an empty query", () => {
    expect(parse("")).toEqual({ q: null, category: null, minRating: null, sort: null, page: 1 });
  });

  it("reads valid values and drops invalid ones", () => {
    expect(parse("q=%20acme%20&category=phones&minRating=4&sort=rating&page=3")).toEqual({
      q: "acme",
      category: "phones",
      minRating: 4,
      sort: "rating",
      page: 3,
    });
    expect(parse("category=nope&minRating=9&sort=nope&page=0")).toEqual({
      q: null,
      category: null,
      minRating: null,
      sort: null,
      page: 1,
    });
  });
});

describe("vendor filter queries", () => {
  it("maps filters to the API query with the page offset", () => {
    expect(toVendorApiQuery(parse("q=acme&category=phones&minRating=3&sort=name&page=2"))).toEqual({
      search: "acme",
      category: "phones",
      minRating: 3,
      sort: "name",
      limit: 12,
      offset: 12,
    });
  });

  it("round-trips through the search params", () => {
    const query = "q=acme&category=phones&minRating=3&sort=name&page=2";

    expect(toVendorSearchParams(parse(query)).toString()).toBe(query);
    expect(toVendorSearchParams(parse("")).toString()).toBe("");
  });
});
