"use client";
import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";

const key = "motoshop-cart-v1";
let cache: CartItem[] = [];
let rawCache: string | null = null;
const listeners = new Set<() => void>();
const empty: CartItem[] = [];
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
function snapshot() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return cache;
  }
  if (raw !== rawCache) {
    rawCache = raw;
    try {
      const parsed = JSON.parse(raw ?? "[]");
      cache = Array.isArray(parsed)
        ? parsed.filter(
            (x: CartItem) =>
              x &&
              typeof x.productId === "string" &&
              typeof x.variantId === "string" &&
              Number.isInteger(x.quantity) &&
              x.quantity > 0 &&
              x.quantity <= 10,
          )
        : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}
function persist(items: CartItem[]) {
  cache = items;
  rawCache = JSON.stringify(items);
  try {
    localStorage.setItem(key, rawCache);
  } catch {
    /* Cart remains usable in memory. */
  }
  listeners.forEach((listener) => listener());
}
type CartContextType = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, variantId: string) => void;
  update: (productId: string, variantId: string, quantity: number) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextType | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, snapshot, () => empty);
  const value: CartContextType = {
    items,
    add(item) {
      const found = items.find(
        (x) => x.productId === item.productId && x.variantId === item.variantId,
      );
      persist(
        found
          ? items.map((x) =>
              x === found
                ? { ...x, quantity: Math.min(10, x.quantity + item.quantity) }
                : x,
            )
          : [...items, item],
      );
    },
    remove(productId, variantId) {
      persist(
        items.filter(
          (x) => x.productId !== productId || x.variantId !== variantId,
        ),
      );
    },
    update(productId, variantId, quantity) {
      persist(
        items.map((x) =>
          x.productId === productId && x.variantId === variantId
            ? { ...x, quantity: Math.max(1, Math.min(10, quantity)) }
            : x,
        ),
      );
    },
    clear() {
      persist([]);
    },
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("StoreProvider is required");
  return context;
}
