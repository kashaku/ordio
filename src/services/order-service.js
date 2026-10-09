import { createId, normalizeSelectedSpecs } from '../utils/id'
import { getPublishedMenu, saveOrder } from './repository'

export function priceCartItem(cartItem, menu) {
  const dish = menu?.dishes?.find((item) => item.id === cartItem.dishId)
  if (!dish || !Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
    return null
  }

  const selected = normalizeSelectedSpecs(cartItem.selectedSpecs)
  const selectedByGroup = new Map()
  for (const item of selected) {
    if (selectedByGroup.has(item.groupId)) {
      return null
    }
    selectedByGroup.set(item.groupId, item.optionId)
  }

  const specDetails = []
  let unitPriceInCents = dish.priceInCents
  for (const group of dish.specs || []) {
    const optionId = selectedByGroup.get(group.id)
    if (!optionId) {
      if (group.required) {
        return null
      }
      continue
    }

    const option = group.options.find((item) => item.id === optionId)
    if (!option) {
      return null
    }
    unitPriceInCents += option.priceDeltaInCents
    specDetails.push({
      groupId: group.id,
      groupName: group.name,
      optionId: option.id,
      optionName: option.name,
      priceDeltaInCents: option.priceDeltaInCents,
    })
    selectedByGroup.delete(group.id)
  }

  if (selectedByGroup.size > 0) {
    return null
  }

  return {
    key: cartItem.key,
    dishId: dish.id,
    name: dish.name,
    image: dish.image || '',
    quantity: cartItem.quantity,
    selectedSpecs: specDetails,
    unitPriceInCents,
    subtotalInCents: unitPriceInCents * cartItem.quantity,
  }
}

export async function resolveCart(storeId, cartItems) {
  const menu = await getPublishedMenu(storeId)
  if (!menu) {
    throw new Error('当前店铺没有已发布菜单')
  }

  const items = []
  const validCartItems = []
  const invalidItems = []
  for (const cartItem of cartItems || []) {
    const resolved = priceCartItem(cartItem, menu)
    if (!resolved) {
      invalidItems.push(cartItem)
      continue
    }
    items.push(resolved)
    validCartItems.push({
      key: cartItem.key,
      storeId,
      dishId: cartItem.dishId,
      quantity: cartItem.quantity,
      selectedSpecs: normalizeSelectedSpecs(cartItem.selectedSpecs),
    })
  }

  return {
    menu,
    items,
    validCartItems,
    invalidItems,
    totalInCents: items.reduce((total, item) => total + item.subtotalInCents, 0),
  }
}

export async function createOrder(storeId, cartItems) {
  const result = await resolveCart(storeId, cartItems)
  if (result.invalidItems.length) {
    const error = new Error('购物车中有已失效的菜品或规格')
    error.code = 'INVALID_CART'
    error.validCartItems = result.validCartItems
    throw error
  }
  if (!result.items.length) {
    throw new Error('购物车为空')
  }

  const createdAt = new Date().toISOString()
  const order = {
    id: createId('order'),
    storeId,
    items: result.items,
    totalInCents: result.totalInCents,
    status: 'pending',
    createdAt,
    paidAt: null,
  }
  return saveOrder(order)
}
