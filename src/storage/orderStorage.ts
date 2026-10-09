import { getPublishedMenu, resolveCart } from '../state/cartStore';
import type { CartItem, Order } from '../types/domain';
import { readOrdioData, writeOrdioData } from './ordioStorage';

export function submitLocalOrder(storeId: string, items: CartItem[], id: string, expectedTotalInCents: number): Order {
  const data = readOrdioData();
  const existing = data.orders.find((order) => order.id === id && order.storeId === storeId);
  if (existing) return existing;
  if (!data.stores.some((store) => store.id === storeId)) throw new Error('店铺不存在，请重新扫码。');
  const menu = getPublishedMenu(data, storeId);
  if (!menu) throw new Error('菜单已下架，请返回菜单重新选择。');
  const cart = resolveCart(menu, items);
  if (!cart.length || cart.length !== items.length) throw new Error('菜品或规格已变更，请返回菜单重新选择。');
  const totalInCents = cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  if (!Number.isSafeInteger(totalInCents) || totalInCents !== expectedTotalInCents) {
    throw new Error('菜品价格已更新，请核对当前金额后再次提交。');
  }
  const order: Order = {
    id,
    storeId,
    items: structuredClone(items),
    total: totalInCents / 100,
    status: 'pending',
    createdAt: new Date().toISOString(),
    itemDetails: cart.map((item) => ({
      dishId: item.dishId,
      name: item.dish.name,
      image: item.dish.image,
      quantity: item.quantity,
      specNames: item.specs.flatMap((spec) => {
        const option = item.dish.specs.find((group) => group.id === spec.groupId)?.options.find((option) => option.id === spec.optionId);
        return option ? [option.name] : [];
      }),
      unitPrice: item.unitPrice / 100,
    })),
  };
  writeOrdioData({ ...data, orders: [...data.orders, order] });
  return order;
}

export function payLocalOrder(storeId: string, orderId: string): Order {
  const data = readOrdioData();
  const order = data.orders.find((item) => item.storeId === storeId && item.id === orderId);
  if (!order) throw new Error('订单不存在，请返回订单列表。');
  if (order.status === 'paid') return order;
  if (order.status !== 'pending') throw new Error('当前订单无法付款。');
  const paid: Order = { ...order, status: 'paid' };
  writeOrdioData({ ...data, orders: data.orders.map((item) => item.id === order.id ? paid : item) });
  return paid;
}
