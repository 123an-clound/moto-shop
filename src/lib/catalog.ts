import type { Product } from "@/types";
import { salePrice, slugify } from "./utils";
export type CatalogFilters = {
  type: string;
  brand: string;
  search: string;
  budget: string;
  cc: string;
  power: string;
  range: string;
  seat: string;
  brake: string;
  sort: string;
};
export const emptyFilters: CatalogFilters = {
  type: "",
  brand: "",
  search: "",
  budget: "",
  cc: "",
  power: "",
  range: "",
  seat: "",
  brake: "",
  sort: "featured",
};
export function filterProducts(
  products: Product[],
  filters: CatalogFilters,
  sales: Record<string, number> = {},
) {
  const result = products.filter((p) => {
    if (filters.type && p.type !== filters.type) return false;
    if (filters.brand && p.brand !== filters.brand) return false;
    if (
      filters.search &&
      !slugify(p.name + " " + p.brand).includes(slugify(filters.search))
    )
      return false;
    const price = salePrice(p);
    if (filters.budget === "under30" && price >= 30000000) return false;
    if (filters.budget === "30to60" && (price < 30000000 || price > 60000000))
      return false;
    if (filters.budget === "60to100" && (price < 60000000 || price > 100000000))
      return false;
    if (filters.budget === "over100" && price <= 100000000) return false;
    if (filters.cc === "under125" && (p.engineCc === null || p.engineCc >= 125))
      return false;
    if (
      filters.cc === "125to175" &&
      (p.engineCc === null || p.engineCc < 125 || p.engineCc > 175)
    )
      return false;
    if (filters.cc === "over175" && (p.engineCc === null || p.engineCc <= 175))
      return false;
    if (
      filters.power &&
      (p.motorKw === null || p.motorKw < Number(filters.power))
    )
      return false;
    if (
      filters.range &&
      (p.rangeKm === null || p.rangeKm < Number(filters.range))
    )
      return false;
    if (
      filters.seat &&
      (p.seatHeight === null || p.seatHeight > Number(filters.seat))
    )
      return false;
    if (filters.brake && !p.brake.toUpperCase().includes(filters.brake))
      return false;
    return true;
  });
  return result.sort((a, b) =>
    filters.sort === "priceAsc"
      ? salePrice(a) - salePrice(b)
      : filters.sort === "priceDesc"
        ? salePrice(b) - salePrice(a)
        : filters.sort === "newest"
          ? b.createdAt.localeCompare(a.createdAt)
          : filters.sort === "best"
            ? (sales[b.id] || 0) - (sales[a.id] || 0)
            : Number(b.featured) - Number(a.featured),
  );
}
