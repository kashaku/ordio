import { localUser, seedData, seedVersion } from '../mock/seedData';
import type { OrdioData } from '../types/domain';

const originalDishIds = new Set(['dish-beef-tomato', 'dish-chicken-bowl', 'dish-lemon-tea']);

export function upgradeSeedData(data: OrdioData): OrdioData {
  if ((data.seedVersion ?? 1) >= seedVersion) return data;
  const stores = [...data.stores, ...structuredClone(seedData.stores.filter((store) => !data.stores.some((item) => item.id === store.id)))];
  const menus = [...data.menus];
  for (const seedMenu of seedData.menus) {
    const index = menus.findIndex((menu) => menu.id === seedMenu.id);
    if (index === -1) {
      // A replacement menu created by the merchant should stay the active menu.
      if (!menus.some((menu) => menu.storeId === seedMenu.storeId)) menus.push(structuredClone(seedMenu));
      continue;
    }
    const current = menus[index];
    const newDishes = seedMenu.dishes.filter((dish) => !originalDishIds.has(dish.id) && !current.dishes.some((item) => item.id === dish.id));
    const newCategories = seedMenu.categories.filter((category) => newDishes.some((dish) => dish.categoryId === category.id) && !current.categories.some((item) => item.id === category.id));
    menus[index] = { ...current, dishes: [...current.dishes, ...structuredClone(newDishes)], categories: [...current.categories, ...structuredClone(newCategories)] };
  }
  const availableDishes = new Set(menus.flatMap((menu) => menu.dishes.map((dish) => `${menu.storeId}/${dish.id}`)));
  const newComments = seedData.comments.filter((comment) => availableDishes.has(`${comment.storeId}/${comment.dishId}`) && !data.comments.some((item) => item.id === comment.id));
  return {
    ...data, seedVersion, stores, menus,
    templates: data.templates.map((template) => ({ ...template, description: template.description === '顶部店铺信息、左侧分类、右侧菜品、底部购物车，适合手机扫码点餐演示。' ? seedData.templates[0].description : template.description })),
    comments: [...data.comments.map((comment) => comment.userNickname === '本地顾客' ? { ...comment, userNickname: localUser.nickname } : comment), ...structuredClone(newComments)],
  };
}
