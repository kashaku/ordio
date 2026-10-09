import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, CreditCard, ImageIcon, ShoppingBag, Store, Wallet } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { getPublishedMenu, resolveCart, useCartStore } from '../state/cartStore';
import { readOrdioData } from '../storage/ordioStorage';
import { payLocalOrder, submitLocalOrder } from '../storage/orderStorage';
import type { CartItem, OrderItemDetail } from '../types/domain';

const emptyCart: CartItem[] = [];
const money = (amount: number) => `¥${amount.toFixed(2)}`;
const dateTime = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });

function useLocalData() {
  const [data, setData] = useState(readOrdioData);
  useEffect(() => {
    const refresh = () => setData(readOrdioData());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return { data, refresh: () => setData(readOrdioData()) };
}

function PageFrame({ storeId, title, children }: { storeId: string; title: string; children: ReactNode }) {
  return <main className="mx-auto min-h-dvh max-w-[480px] bg-white pb-[calc(110px+env(safe-area-inset-bottom))] font-sans text-ink">
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-white px-3 py-2">
      <Link to={`/m/${storeId}`} aria-label="返回菜单" title="返回菜单" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-neutral-100"><ArrowLeft size={20} /></Link>
      <h1 className="min-w-0 flex-1 text-base font-semibold">{title}</h1>
      {title !== '我的订单' && <Link to={`/m/${storeId}/orders`} className="flex min-h-11 items-center gap-1 px-2 text-sm text-leaf"><ClipboardList size={16} />订单</Link>}
    </header>
    {children}
  </main>;
}

function OrderLines({ items }: { items: OrderItemDetail[] }) {
  return <div>{items.map((item, index) => <div key={`${item.dishId}-${index}`} className="flex gap-3 border-b border-neutral-100 py-4">
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 text-neutral-400">
      <ImageIcon size={22} />
      {item.image && <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />}
    </div>
    <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{item.name}</h3><p className="mt-1 break-words text-xs leading-5 text-neutral-500">{item.specNames.join(' / ') || '标准份'}</p><p className="mt-1 text-xs text-neutral-500">{money(item.unitPrice)} × {item.quantity}</p></div>
    <strong className="shrink-0 text-sm">{money(Math.round(item.unitPrice * 100) * item.quantity / 100)}</strong>
  </div>)}</div>;
}

function EmptyState({ storeId, title, message }: { storeId: string; title: string; message: string }) {
  return <div className="px-5 py-16 text-center"><ShoppingBag size={36} className="mx-auto mb-4 text-neutral-300" /><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-neutral-500">{message}</p><Link to={`/m/${storeId}`} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-leaf px-5 text-sm font-medium text-white">返回菜单</Link></div>;
}

export function CheckoutPage() {
  const { storeId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data, refresh } = useLocalData();
  const items = useCartStore((state) => state.carts[storeId] ?? emptyCart);
  const clear = useCartStore((state) => state.clear);
  const [attemptId] = useState(() => crypto.randomUUID());
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const orderId = searchParams.get('order');
  const store = data.stores.find((item) => item.id === storeId);
  const order = data.orders.find((item) => item.storeId === storeId && item.id === orderId);
  const cart = resolveCart(getPublishedMenu(data, storeId), items);
  const totalInCents = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const valid = cart.length > 0 && cart.length === items.length && Number.isSafeInteger(totalInCents);
  const details: OrderItemDetail[] = cart.map((item) => ({
    dishId: item.dishId, name: item.dish.name, image: item.dish.image, quantity: item.quantity,
    specNames: item.specs.flatMap((spec) => {
      const option = item.dish.specs.find((group) => group.id === spec.groupId)?.options.find((option) => option.id === spec.optionId);
      return option ? [option.name] : [];
    }),
    unitPrice: item.unitPrice / 100,
  }));

  function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      const nextOrder = submitLocalOrder(storeId, useCartStore.getState().carts[storeId] ?? [], `order-${storeId}-${attemptId}`, totalInCents);
      clear(storeId);
      refresh();
      navigate(`/m/${storeId}/checkout?order=${encodeURIComponent(nextOrder.id)}`, { replace: true });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '订单未能保存，请重试。');
      refresh();
    } finally {
      submitting.current = false;
    }
  }

  function pay() {
    if (!order || submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      payLocalOrder(storeId, order.id);
      refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : '付款状态未能保存，请重试。');
    } finally {
      submitting.current = false;
    }
  }

  if (!store) return <PageFrame storeId={storeId} title="结算"><EmptyState storeId={storeId} title="店铺不存在" message="请使用商家提供的二维码重新进入。" /></PageFrame>;
  if (orderId && !order) return <PageFrame storeId={storeId} title="订单详情"><EmptyState storeId={storeId} title="订单不存在" message="请确认订单属于当前店铺，或查看本地订单列表。" /></PageFrame>;

  if (order) return <PageFrame storeId={storeId} title="订单详情">
    <section className="border-b px-5 py-7">
      <div className="flex items-center gap-3">{order.status === 'paid' ? <CheckCircle2 size={32} className="text-leaf" /> : <Wallet size={32} className="text-clay" />}<div><h2 className="text-xl font-semibold">{order.status === 'paid' ? '模拟付款成功' : order.status === 'pending' ? '订单已提交，待付款' : '订单已取消'}</h2><p className="mt-1 text-sm text-neutral-500">{store.name}</p></div></div>
      <p className="mt-4 text-xs text-neutral-500">仅用于演示，不会产生真实扣款。</p>
    </section>
    <section className="px-5 py-5"><h2 className="text-sm font-semibold">订单明细</h2>
      {order.itemDetails ? <OrderLines items={order.itemDetails} /> : <p className="py-4 text-sm text-neutral-500">此历史订单未保存菜品快照，共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 份。</p>}
      <div className="mt-4 flex justify-between gap-3 text-sm"><span>订单金额</span><strong className="text-lg">{money(order.total)}</strong></div>
      <dl className="mt-6 space-y-3 border-t pt-5 text-xs text-neutral-500"><div><dt>订单编号</dt><dd className="mt-1 break-all leading-5 text-ink">{order.id}</dd></div><div><dt>下单时间</dt><dd className="mt-1 text-ink">{dateTime(order.createdAt)}</dd></div><div className="flex justify-between"><dt>付款方式</dt><dd className="text-ink">本地模拟付款</dd></div></dl>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </section>
    <footer className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] border-t bg-white px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
      {order.status === 'pending' ? <button type="button" onClick={pay} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-citrus text-sm font-semibold"><CreditCard size={18} />模拟付款 {money(order.total)}</button> : <Link to={`/m/${storeId}`} className="flex min-h-12 items-center justify-center rounded-lg bg-leaf text-sm font-medium text-white">继续点餐</Link>}
    </footer>
  </PageFrame>;

  return <PageFrame storeId={storeId} title="确认订单">
    {items.length === 0 ? <EmptyState storeId={storeId} title="购物车是空的" message="先选择菜品，再来确认订单。" /> : <>
      <section className="flex items-center gap-3 border-b px-5 py-5"><Store size={23} className="shrink-0 text-leaf" /><div className="min-w-0"><h2 className="break-words font-semibold">{store.name}</h2><p className="mt-1 text-xs text-neutral-500">{store.location}</p></div></section>
      <section className="px-5 py-5"><h2 className="text-sm font-semibold">已选菜品</h2><OrderLines items={details} />
        {!valid && <p role="alert" className="mt-4 text-sm leading-6 text-red-700">部分菜品或规格已变更，请返回菜单重新选择。</p>}
        <div className="mt-5 flex justify-between text-sm"><span className="text-neutral-500">共 {cart.reduce((sum, item) => sum + item.quantity, 0)} 份</span><strong>{money(totalInCents / 100)}</strong></div>
      </section>
      <section className="border-t px-5 py-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={18} />本地模拟付款</h2><p className="mt-2 text-xs leading-6 text-neutral-500">提交后生成待付款订单，模拟付款不会产生真实扣款。</p></section>
      {error && <p role="alert" className="px-5 text-sm leading-6 text-red-700">{error}</p>}
      <footer className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[480px] items-center gap-3 border-t bg-white px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]"><div className="min-w-0 flex-1"><span className="text-xs text-neutral-500">合计</span><strong className="block text-xl">{money(totalInCents / 100)}</strong></div><button type="button" disabled={!valid} onClick={submit} className="min-h-12 rounded-lg bg-citrus px-5 text-sm font-semibold disabled:opacity-40">提交订单</button></footer>
    </>}
  </PageFrame>;
}

export function OrderListPage() {
  const { storeId = '' } = useParams();
  const { data } = useLocalData();
  const store = data.stores.find((item) => item.id === storeId);
  const orders = data.orders.filter((order) => order.storeId === storeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <PageFrame storeId={storeId} title="我的订单">
    {!store ? <EmptyState storeId={storeId} title="店铺不存在" message="请使用商家提供的二维码重新进入。" /> : orders.length === 0 ? <EmptyState storeId={storeId} title="还没有订单" message="选好菜品并提交后，订单会显示在这里。" /> : <>
      <p className="border-b px-5 py-4 text-sm text-neutral-500">{store.name}</p>
      <section aria-label="订单列表" className="px-5">{orders.map((order) => <article key={order.id} className="border-b py-5">
        <div className="flex items-center justify-between gap-3"><span className="text-xs text-neutral-500">{dateTime(order.createdAt)}</span><span className={`shrink-0 text-sm font-medium ${order.status === 'paid' ? 'text-leaf' : 'text-clay'}`}>{order.status === 'paid' ? '已付款' : order.status === 'pending' ? '待付款' : '已取消'}</span></div>
        <p className="mt-3 break-words text-sm font-medium">{order.itemDetails?.map((item) => `${item.name} × ${item.quantity}`).join('、') || `共 ${order.items.reduce((sum, item) => sum + item.quantity, 0)} 份菜品`}</p>
        <div className="mt-3 flex items-center justify-between gap-3"><strong>{money(order.total)}</strong><Link to={`/m/${storeId}/checkout?order=${encodeURIComponent(order.id)}`} className="flex min-h-11 items-center rounded-lg border px-3 text-sm">{order.status === 'pending' ? '继续付款' : '查看订单'}</Link></div>
      </article>)}</section>
    </>}
  </PageFrame>;
}
