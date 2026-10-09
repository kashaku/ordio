import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CartItem, Dish, SelectedSpec } from '../types/domain';

export function cartItemKey(dishId: string, specs: SelectedSpec[]): string {
  return JSON.stringify([dishId, [...specs].sort((a, b) => a.groupId.localeCompare(b.groupId))]);
}

export function dishPriceInCents(dish: Dish, specs: SelectedSpec[]): number {
  return Math.round(dish.price * 100) + specs.reduce((total, selection) => {
    const option = dish.specs.find((group) => group.id === selection.groupId)
      ?.options.find((item) => item.id === selection.optionId);
    return total + Math.round((option?.priceDelta ?? 0) * 100);
  }, 0);
}

interface CartState {
  carts: Record<string, CartItem[]>;
  add: (storeId: string, dishId: string, specs: SelectedSpec[]) => void;
  changeQuantity: (storeId: string, key: string, delta: number) => void;
  clear: (storeId: string) => void;
}

export const useCartStore = create<CartState>()(persist((set) => ({
  carts: {},
  add: (storeId, dishId, specs) => set((state) => {
    const items = state.carts[storeId] ?? [];
    const key = cartItemKey(dishId, specs);
    const exists = items.some((item) => cartItemKey(item.dishId, item.specs) === key);
    const next = exists
      ? items.map((item) => cartItemKey(item.dishId, item.specs) === key
        ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { dishId, quantity: 1, specs }];
    return { carts: { ...state.carts, [storeId]: next } };
  }),
  changeQuantity: (storeId, key, delta) => set((state) => ({
    carts: {
      ...state.carts,
      [storeId]: (state.carts[storeId] ?? []).map((item) =>
        cartItemKey(item.dishId, item.specs) === key
          ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
      ).filter((item) => item.quantity > 0),
    },
  })),
  clear: (storeId) => set((state) => ({ carts: { ...state.carts, [storeId]: [] } })),
}), { name: 'ordio.customer-cart.v1', partialize: (state) => ({ carts: state.carts }) }));
