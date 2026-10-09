import { DATA_VERSION, createSeedState } from '../data/seed'

const keys = {
  version: 'ordio:mvp:version',
  stores: 'ordio:mvp:stores',
  draftMenus: 'ordio:mvp:draft-menus',
  publishedMenus: 'ordio:mvp:published-menus',
  draftStorefronts: 'ordio:mvp:draft-storefronts',
  publishedStorefronts: 'ordio:mvp:published-storefronts',
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
  write(keys.draftStorefronts, state.draftStorefronts)
  write(keys.publishedStorefronts, state.publishedStorefronts)
  write(keys.carts, state.carts)
  write(keys.orders, state.orders)
}

async function initialize() {
  const version = read(keys.version, 0)
  if (version === DATA_VERSION) {
    if (!read(keys.draftStorefronts, null) || !read(keys.publishedStorefronts, null)) {
      const seed = createSeedState()
      write(keys.draftStorefronts, seed.draftStorefronts)
      write(keys.publishedStorefronts, seed.publishedStorefronts)
    }
    return
  }
  if (version === 1) {
    const seed = createSeedState()
    write(keys.draftStorefronts, seed.draftStorefronts)
    write(keys.publishedStorefronts, seed.publishedStorefronts)
    write(keys.version, DATA_VERSION)
    return
  }
  if (version !== DATA_VERSION) {
    writeState(createSeedState())
  }
}

async function getStore(storeId) {
  await initialize()
  const stores = read(keys.stores, [])
  const store = stores.find((item) => item.id === storeId)
  return store ? clone(store) : null
}

async function saveStore(store) {
  await initialize()
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

async function getDraftMenu(storeId) {
  await initialize()
  const menu = read(keys.draftMenus, {})[storeId]
  return menu ? clone(menu) : null
}

async function saveDraftMenu(menu) {
  await initialize()
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

async function publishMenu(storeId) {
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

async function getPublishedMenu(storeId) {
  await initialize()
  const menu = read(keys.publishedMenus, {})[storeId]
  return menu ? clone(menu) : null
}

async function getDraftStorefront(storeId) {
  await initialize()
  const storefront = read(keys.draftStorefronts, {})[storeId]
  return storefront ? clone(storefront) : null
}

function validateStorefront(storefront) {
  if (!storefront || !storefront.id || !storefront.storeId) {
    throw new Error('主页数据不完整')
  }
  if (!String(storefront.hero?.title || '').trim()) {
    throw new Error('主页标题不能为空')
  }
  if (!Array.isArray(storefront.blocks) || !storefront.blocks.length) {
    throw new Error('主页至少需要一个内容区块')
  }
}

async function saveDraftStorefront(storefront) {
  await initialize()
  validateStorefront(storefront)
  const storefronts = read(keys.draftStorefronts, {})
  const saved = clone({
    ...storefront,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  })
  storefronts[saved.storeId] = saved
  write(keys.draftStorefronts, storefronts)
  return clone(saved)
}

async function publishStorefront(storeId) {
  const [store, draft] = await Promise.all([
    getStore(storeId),
    getDraftStorefront(storeId),
  ])
  if (!store) {
    throw new Error('店铺不存在')
  }
  validateStorefront(draft)

  const publishedAt = new Date().toISOString()
  const published = clone({
    ...draft,
    status: 'published',
    publishedAt,
  })
  const publishedStorefronts = read(keys.publishedStorefronts, {})
  publishedStorefronts[storeId] = published
  write(keys.publishedStorefronts, publishedStorefronts)

  const draftStorefronts = read(keys.draftStorefronts, {})
  draftStorefronts[storeId] = {
    ...draft,
    status: 'draft',
    publishedAt,
  }
  write(keys.draftStorefronts, draftStorefronts)
  return clone(published)
}

async function getPublishedStorefront(storeId) {
  await initialize()
  const storefront = read(keys.publishedStorefronts, {})[storeId]
  return storefront ? clone(storefront) : null
}

async function getCart(storeId) {
  await initialize()
  return clone(read(keys.carts, {})[storeId] || [])
}

async function saveCart(storeId, items) {
  await initialize()
  const carts = read(keys.carts, {})
  carts[storeId] = clone(items || [])
  write(keys.carts, carts)
  return clone(carts[storeId])
}

async function saveOrder(order) {
  await initialize()
  const orders = read(keys.orders, [])
  orders.push(clone(order))
  write(keys.orders, orders)
  return clone(order)
}

async function getOrder(orderId) {
  await initialize()
  const order = read(keys.orders, []).find((item) => item.id === orderId)
  return order ? clone(order) : null
}

async function listOrders(storeId) {
  await initialize()
  return read(keys.orders, [])
    .filter((item) => item.storeId === storeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(clone)
}

async function payOrder(orderId) {
  await initialize()
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

async function resetDemoData() {
  const state = createSeedState()
  writeState(state)
  return clone(state)
}

export const localRepository = {
  initialize,
  getStore,
  saveStore,
  getDraftMenu,
  saveDraftMenu,
  publishMenu,
  getPublishedMenu,
  getDraftStorefront,
  saveDraftStorefront,
  publishStorefront,
  getPublishedStorefront,
  getCart,
  saveCart,
  saveOrder,
  getOrder,
  listOrders,
  payOrder,
  resetDemoData,
}
