export const DATA_VERSION = 1

export function createSeedState() {
  const now = new Date().toISOString()
  const store = {
    id: 'store-demo',
    name: '禾间小馆',
    cover: '',
    address: '上海市静安区愚园路 88 号',
    businessHours: '10:30-21:30',
  }

  const categories = [
    { id: 'category-signature', name: '招牌推荐', sortOrder: 1 },
    { id: 'category-snacks', name: '饮品小食', sortOrder: 2 },
  ]

  const dishes = [
    {
      id: 'dish-beef-rice',
      categoryId: 'category-signature',
      name: '番茄牛腩饭',
      image: '',
      priceInCents: 3600,
      description: '慢炖牛腩配番茄汤汁、时蔬和米饭。',
      specs: [
        {
          id: 'spec-rice',
          name: '米饭份量',
          required: true,
          options: [
            { id: 'rice-normal', name: '正常饭量', priceDeltaInCents: 0 },
            { id: 'rice-extra', name: '加饭', priceDeltaInCents: 200 },
          ],
        },
      ],
    },
    {
      id: 'dish-chicken-rice',
      categoryId: 'category-signature',
      name: '照烧鸡腿饭',
      image: '',
      priceInCents: 3200,
      description: '去骨鸡腿配照烧酱和清爽时蔬。',
      specs: [],
    },
    {
      id: 'dish-lemon-tea',
      categoryId: 'category-snacks',
      name: '手打柠檬茶',
      image: '',
      priceInCents: 1500,
      description: '现切柠檬，茶感清爽。',
      specs: [
        {
          id: 'spec-sugar',
          name: '甜度',
          required: true,
          options: [
            { id: 'sugar-none', name: '无糖', priceDeltaInCents: 0 },
            { id: 'sugar-less', name: '少糖', priceDeltaInCents: 0 },
            { id: 'sugar-normal', name: '正常糖', priceDeltaInCents: 0 },
          ],
        },
      ],
    },
    {
      id: 'dish-potato',
      categoryId: 'category-snacks',
      name: '香草烤薯角',
      image: '',
      priceInCents: 1600,
      description: '带皮薯角配迷迭香和番茄蘸酱。',
      specs: [],
    },
  ]

  const draftMenu = {
    id: 'menu-demo',
    storeId: store.id,
    status: 'draft',
    categories,
    dishes,
    updatedAt: now,
    publishedAt: now,
  }

  const publishedMenu = {
    ...JSON.parse(JSON.stringify(draftMenu)),
    status: 'published',
  }

  return {
    version: DATA_VERSION,
    stores: [store],
    draftMenus: { [store.id]: draftMenu },
    publishedMenus: { [store.id]: publishedMenu },
    carts: {},
    orders: [],
  }
}
