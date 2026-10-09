import { defineStore } from 'pinia'

import { priceCartItem } from '../services/order-service'
import { getCart, saveCart } from '../services/repository'
import { buildCartKey, normalizeSelectedSpecs } from '../utils/id'

export const useCartStore = defineStore('cart', {
  state: () => ({
    currentStoreId: '',
    carts: {},
  }),

  getters: {
    currentItems(state) {
      return state.carts[state.currentStoreId] || []
    },
    totalQuantity() {
      return this.currentItems.reduce((total, item) => total + item.quantity, 0)
    },
    totalInCents() {
      return (menu) => this.currentItems.reduce((total, item) => {
        const priced = priceCartItem(item, menu)
        return total + (priced ? priced.subtotalInCents : 0)
      }, 0)
    },
  },

  actions: {
    async load(storeId) {
      this.currentStoreId = storeId
      const items = await getCart(storeId)
      this.carts = { ...this.carts, [storeId]: items }
    },

    async persist(storeId) {
      await saveCart(storeId, this.carts[storeId] || [])
    },

    async addItem(storeId, dishId, selectedSpecs = []) {
      this.currentStoreId = storeId
      const normalizedSpecs = normalizeSelectedSpecs(selectedSpecs)
      const key = buildCartKey(dishId, normalizedSpecs)
      const items = [...(this.carts[storeId] || [])]
      const index = items.findIndex((item) => item.key === key)
      if (index >= 0) {
        items[index] = { ...items[index], quantity: items[index].quantity + 1 }
      } else {
        items.push({
          key,
          storeId,
          dishId,
          quantity: 1,
          selectedSpecs: normalizedSpecs,
        })
      }
      this.carts = { ...this.carts, [storeId]: items }
      await this.persist(storeId)
    },

    async setQuantity(storeId, key, quantity) {
      const current = this.carts[storeId] || []
      const next = quantity <= 0
        ? current.filter((item) => item.key !== key)
        : current.map((item) => item.key === key ? { ...item, quantity } : item)
      this.carts = { ...this.carts, [storeId]: next }
      await this.persist(storeId)
    },

    async removeItem(storeId, key) {
      await this.setQuantity(storeId, key, 0)
    },

    async replaceItems(storeId, items) {
      this.carts = { ...this.carts, [storeId]: items }
      await this.persist(storeId)
    },

    async clear(storeId) {
      await this.replaceItems(storeId, [])
    },

    resetState() {
      this.currentStoreId = ''
      this.carts = {}
    },
  },
})
