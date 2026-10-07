import { describe, it, expect } from "vitest";
import seed from "@/data/products.json";
import type { Product } from "@/types";
import { filterProducts, emptyFilters } from "./catalog";
import { calculateInstallment } from "./installment";
import { safeJsonLd } from "./seo";
const products = seed as Product[];
describe("catalog filters", () => {
  it("combines type, brand and price without losing constraints", () => {
    const result = filterProducts(products, {
      ...emptyFilters,
      type: "electric",
      brand: "VinFast",
      budget: "under30",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (p) =>
          p.type === "electric" && p.brand === "VinFast" && p.price < 30000000,
      ),
    ).toBe(true);
  });
  it("searches Vietnamese words with or without accents", () => {
    expect(
      filterProducts(products, { ...emptyFilters, search: "the thao" }).length,
    ).toBeGreaterThan(0);
  });
  it("does not turn missing specs into matching zeroes", () => {
    const result = filterProducts(products, { ...emptyFilters, seat: "760" });
    expect(
      result.every((p) => p.seatHeight !== null && p.seatHeight <= 760),
    ).toBe(true);
  });
  it("sorts using sale price and actual completed sales", () => {
    const testProducts = [
      { ...products[0], price: 100, salePrice: 10 },
      { ...products[1], price: 50, salePrice: null },
    ];
    expect(
      filterProducts(testProducts, { ...emptyFilters, sort: "priceAsc" })[0].id,
    ).toBe(testProducts[0].id);
    expect(
      filterProducts(
        products,
        { ...emptyFilters, sort: "best" },
        { [products[12].id]: 5 },
      )[0].id,
    ).toBe(products[12].id);
  });
});
describe("installment estimates", () => {
  it("supports zero interest without division by zero", () => {
    expect(calculateInstallment(60000000, 50, 12, 0)).toEqual({
      downPayment: 30000000,
      principal: 30000000,
      monthlyPayment: 2500000,
      totalInterest: 0,
    });
  });
  it("calculates amortized payments and full upfront payment", () => {
    const value = calculateInstallment(60000000, 30, 12, 12);
    expect(value.principal).toBe(42000000);
    let balance = value.principal;
    for (let month = 0; month < 12; month++)
      balance = balance * 1.01 - value.monthlyPayment;
    expect(Math.abs(balance)).toBeLessThan(13);
    expect(calculateInstallment(60000000, 100, 12, 12).monthlyPayment).toBe(0);
  });
});
it("escapes script delimiters in JSON-LD", () => {
  expect(
    safeJsonLd({ name: "</script><script>alert(1)</script>" }),
  ).not.toContain("<");
  expect(JSON.parse(safeJsonLd({ name: "xe" })).name).toBe("xe");
});
