import { DATA_VERSION, createSeedState } from '../data/seed'

const keys = {
  version: 'ordio:mvp:version',
  stores: 'ordio:mvp:stores',
  draftMenus: 'ordio:mvp:draft-menus',
  publishedMenus: 'ordio:mvp:published-menus',
  carts: 'ordio:mvp:carts',
  orders: 'ordio:mvp:orders',
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function read(key, fallback) {
  const value = uni.getStorageSync(key)
  return value === '' || value === undefined || value === null ? fallback : value
}

function write(key, value) {
  uni.setStorageSync(key, value)
}

function writeState(state) {
  write(keys.version, state.version)
  write(keys.stores, state.stores)
  write(keys.draftMenus, state.draftMenus)
  write(keys.publishedMenus, state.publishedMenus)
  write(keys.carts, state.carts)
  write(keys.orders, state.orders)
}

export async function initializeRepository() {
  if (read(keys.version, 0) !== DATA_VERSION) {
    writeState(createSeedState())
  }
}

export async function getStore(storeId) {
  await initializeRepository()
  const stores = read(keys.stores, [])
  const store = stores.find((item) => item.id === storeId)
  return store ? clone(store) : null
}

export async function saveStore(store) {
  await initializeRepository()
  if (!store || !store.id || !String(store.name || '').trim()) {
    throw new Error('店铺名称不能为空')
  }

  const stores = read(keys.stores, [])
  const saved = {
    id: store.id,
    name: String(store.name).trim(),
    cover: store.cover || '',
    address: String(store.address || '').trim(),
    businessHours: String(store.businessHours || '').trim(),
  }
  const index = stores.findIndex((item) => item.id === saved.id)
  if (index >= 0) {
    stores[index] = saved
  } else {
    stores.push(saved)
  }
  write(keys.stores, stores)
  return clone(saved)
}

export async function getDraftMenu(storeId) {
  await initializeRepository()
  const menu = read(keys.draftMenus, {})[storeId]
  return menu ? clone(menu) : null
}

export async function saveDraftMenu(menu) {
  await initializeRepository()
  if (!menu || !menu.id || !menu.storeId) {
    throw new Error('菜单数据不完整')
  }

  const menus = read(keys.draftMenus, {})
  const saved = clone({
    ...menu,
    status: 'draft',
    categories: Array.isArray(menu.categories) ? menu.categories : [],
    dishes: Array.isArray(menu.dishes) ? menu.dishes : [],
    updatedAt: new Date().toISOString(),
  })
  menus[saved.storeId] = saved
  write(keys.draftMenus, menus)
  return clone(saved)
}

function validateMenu(store, menu) {
  if (!store || !menu) {
    throw new Error('店铺或菜单不存在')
  }
  if (!String(store.name || '').trim()) {
    throw new Error('店铺名称不能为空')
  }
  if (!menu.categories.length) {
    throw new Error('至少需要一个分类')
  }
  if (!menu.dishes.length) {
    throw new Error('至少需要一个菜品')
  }

  const categoryIds = new Set()
  menu.categories.forEach((category) => {
    if (!category.id || !String(category.name || '').trim()) {
      throw new Error('分类名称不能为空')
    }
    categoryIds.add(category.id)
  })

  menu.dishes.forEach((dish) => {
    if (!dish.id || !String(dish.name || '').trim()) {
      throw new Error('菜品名称不能为空')
    }
    if (!categoryIds.has(dish.categoryId)) {
      throw new Error(`菜品“${dish.name}”没有有效分类`)
    }
    if (!Number.isInteger(dish.priceInCents) || dish.priceInCents < 0) {
      throw new Error(`菜品“${dish.name}”价格无效`)
    }
    ;(dish.specs || []).forEach((group) => {
      if (!group.id || !String(group.name || '').trim() || !group.options?.length) {
        throw new Error(`菜品“${dish.name}”的规格不完整`)
      }
      group.options.forEach((option) => {
        if (
          !option.id ||
          !String(option.name || '').trim() ||
          !Number.isInteger(option.priceDeltaInCents) ||
          option.priceDeltaInCents < 0
        ) {
          throw new Error(`菜品“${dish.name}”的规格选项无效`)
        }
      })
    })
  })
}

export async function publishMenu(storeId) {
  const [store, draft] = await Promise.all([
    getStore(storeId),
    getDraftMenu(storeId),
  ])
  validateMenu(store, draft)

  const publishedAt = new Date().toISOString()
  const published = clone({
    ...draft,
    status: 'published',
    publishedAt,
  })
  const publishedMenus = read(keys.publishedMenus, {})
  publishedMenus[storeId] = published
  write(keys.publishedMenus, publishedMenus)

  const draftMenus = read(keys.draftMenus, {})
  draftMenus[storeId] = {
    ...draft,
    status: 'draft',
    publishedAt,
  }
  write(keys.draftMenus, draftMenus)
  return clone(published)
}

export async function getPublishedMenu(storeId) {
  await initializeRepository()
  const menu = read(keys.publishedMenus, {})[storeId]
  return menu ? clone(menu) : null
}

export async function getCart(storeId) {
  await initializeRepository()
  return clone(read(keys.carts, {})[storeId] || [])
}

export async function saveCart(storeId, items) {
  await initializeRepository()
  const carts = read(keys.carts, {})
  carts[storeId] = clone(items || [])
  write(keys.carts, carts)
  return clone(carts[storeId])
}

export async function saveOrder(order) {
  await initializeRepository()
  const orders = read(keys.orders, [])
  orders.push(clone(order))
  write(keys.orders, orders)
  return clone(order)
}

export async function getOrder(orderId) {
  await initializeRepository()
  const order = read(keys.orders, []).find((item) => item.id === orderId)
  return order ? clone(order) : null
}

export async function listOrders(storeId) {
  await initializeRepository()
  return read(keys.orders, [])
    .filter((item) => item.storeId === storeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(clone)
}

export async function payOrder(orderId) {
  await initializeRepository()
  const orders = read(keys.orders, [])
  const index = orders.findIndex((item) => item.id === orderId)
  if (index < 0) {
    throw new Error('订单不存在')
  }
  if (orders[index].status === 'paid') {
    return clone(orders[index])
  }

  orders[index] = {
    ...orders[index],
    status: 'paid',
    paidAt: new Date().toISOString(),
  }
  write(keys.orders, orders)
  return clone(orders[index])
}

export async function resetDemoData() {
  const state = createSeedState()
  writeState(state)
  return clone(state)
}
