import { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Plus, ShoppingBag, Star, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { DishImage } from '../components/customer/DishImage';
import { DishOptions } from '../components/customer/DishOptions';
import { dishPriceInCents, getPublishedMenu, resolveCart, useCartStore } from '../state/cartStore';
import { readOrdioData } from '../storage/ordioStorage';
import type { CartItem, Comment, Dish, Menu, SelectedSpec, Store } from '../types/domain';

const emptyCart: CartItem[] = [];
const money = (cents: number) => `¥${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;

function CommentEntry({ comment, menu }: { comment: Comment; menu: Menu }) {
  const pairedDishes = menu.dishes.filter((dish) => comment.selectedDishIds.includes(dish.id));
  return <article className="border-b border-neutral-100 py-5 last:border-0">
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-500">
        <UserRound size={18} />
        {comment.avatar && <img src={comment.avatar} alt={`${comment.userNickname}的头像`} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />}
      </div>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{comment.userNickname}</p><time dateTime={comment.createdAt} className="mt-1 block text-xs text-neutral-400">{new Date(comment.createdAt).toLocaleDateString('zh-CN')}</time></div>
      <span className="flex shrink-0 items-center gap-1 text-xs" aria-label={`${comment.rating}分`}><Star size={14} className="fill-citrus text-citrus" />{comment.rating.toFixed(1)}</span>
    </div>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{comment.content}</p>
    {comment.images.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{comment.images.map((src, index) => <DishImage key={`${src}-${index}`} src={src} name={`${comment.userNickname}的评论图片${index + 1}`} />)}</div>}
    {pairedDishes.length > 0 && <p className="mt-3 break-words text-xs leading-5 text-neutral-500">菜品搭配：{pairedDishes.map((dish) => dish.name).join('、')}</p>}
  </article>;
}

interface DetailContentProps {
  store: Store;
  menu: Menu;
  dish: Dish;
  comments: Comment[];
}

function DetailContent({ store, menu, dish, comments }: DetailContentProps) {
  const [specs, setSpecs] = useState<SelectedSpec[]>(() => dish.specs.flatMap((group) =>
    group.required && group.options[0] ? [{ groupId: group.id, optionId: group.options[0].id }] : [],
  ));
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const items = useCartStore((state) => state.carts[store.id] ?? emptyCart);
  const add = useCartStore((state) => state.add);
  const cart = resolveCart(menu, items);
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const dishQuantity = cart.filter((item) => item.dishId === dish.id).reduce((sum, item) => sum + item.quantity, 0);
  const price = dishPriceInCents(dish, specs);
  const valid = resolveCart(menu, [{ dishId: dish.id, quantity: 1, specs }]).length === 1;

  function addDish() {
    setError('');
    setFeedback('');
    const latest = getPublishedMenu(readOrdioData(), store.id);
    if (resolveCart(latest, [{ dishId: dish.id, quantity: 1, specs }]).length !== 1) {
      setError('菜品或规格已变更，请刷新页面重新选择。');
      return;
    }
    try {
      add(store.id, dish.id, specs);
      setFeedback('已加入购物车');
    } catch {
      setError('购物车未能保存，请检查本地存储空间后重试。');
    }
  }

  return <>
    <DishImage src={dish.image} name={dish.name} variant="detail" />
    <section className="border-b px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-2"><h1 className="min-w-0 break-words text-2xl font-bold">{dish.name}</h1><span className="pt-1 text-xs text-neutral-500">月售 {dish.sales}</span></div>
      <div className="mt-3 flex flex-wrap gap-2">{dish.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded border border-green-100 px-2 py-0.5 text-xs text-leaf">{tag}</span>)}</div>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-600">{dish.description || '暂无菜品描述'}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><strong className="text-xl text-clay">{money(price)}</strong><a href="#dish-comments" className="flex min-h-11 items-center gap-1 text-sm text-leaf"><MessageSquare size={16} />菜品评论（{comments.length}）</a></div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500"><span className="flex items-center gap-1"><Star size={13} className="fill-citrus text-citrus" />店铺评分 {store.rating.toFixed(1)}</span><span>{store.location}</span></p>
    </section>
    <section className="border-b px-5 py-5" aria-label="菜品规格">
      <h2 className="mb-4 text-sm font-semibold">选择规格</h2>
      {dish.specs.length > 0 ? <DishOptions dish={dish} value={specs} onChange={(next) => { setSpecs(next); setFeedback(''); setError(''); }} /> : <p className="text-sm text-neutral-500">标准份</p>}
      {dishQuantity > 0 && <p className="mt-3 text-xs text-neutral-500">此菜品已选 {dishQuantity} 份</p>}
      <p role="status" className="mt-2 min-h-5 text-xs text-leaf">{feedback}</p>
      {error && <p role="alert" className="mt-2 text-sm leading-6 text-red-700">{error}</p>}
    </section>
    <section id="dish-comments" aria-label="菜品评论" className="scroll-mt-20 px-5 py-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">菜品评论</h2><span className="text-xs text-neutral-500">{comments.length} 条</span></div>
      {comments.length > 0 ? comments.map((comment) => <CommentEntry key={comment.id} comment={comment} menu={menu} />) : <p className="py-8 text-center text-sm text-neutral-500">这道菜还没有评论。</p>}
    </section>
    <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[480px] items-center gap-3 border-t bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <Link to={`/m/${store.id}/checkout`} aria-label={`去结算，购物车${quantity}份`} title="去结算" className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border"><ShoppingBag size={22} />{quantity > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-citrus px-1.5 text-xs font-medium">{quantity}</span>}</Link>
      <div className="min-w-0 flex-1"><span className="text-xs text-neutral-500">所选单价</span><strong className="block truncate text-xl text-clay">{money(price)}</strong></div>
      <button type="button" onClick={addDish} disabled={!valid} className="flex min-h-12 shrink-0 items-center justify-center gap-1 rounded-lg bg-citrus px-3 text-sm font-semibold disabled:opacity-40"><Plus size={18} />加入购物车</button>
    </footer>
  </>;
}

export function DishDetailPage() {
  const { storeId = '', dishId = '' } = useParams();
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
  useEffect(() => { window.scrollTo(0, 0); }, [storeId, dishId]);

  const store = data.stores.find((item) => item.id === storeId);
  const menu = getPublishedMenu(data, storeId);
  const dish = menu?.dishes.find((item) => item.id === dishId && item.storeId === storeId);
  const comments = data.comments.filter((comment) => comment.storeId === storeId && (comment.commentedDishId ?? comment.dishId) === dishId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <main className="mx-auto min-h-dvh max-w-[480px] bg-white pb-[calc(100px+env(safe-area-inset-bottom))] font-sans text-ink">
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-3 py-2">
      <Link to={`/m/${storeId}`} aria-label="返回菜单" title="返回菜单" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-neutral-100"><ArrowLeft size={20} /></Link>
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{store?.name ?? '菜品详情'}</p>
    </header>
    {store && menu && dish ? <DetailContent key={`${storeId}-${dish.id}-${JSON.stringify(dish.specs)}`} store={store} menu={menu} dish={dish} comments={comments} /> : <div className="px-5 py-16 text-center"><ShoppingBag size={36} className="mx-auto mb-4 text-neutral-300" /><h1 className="text-lg font-semibold">{!store ? '店铺不存在' : !menu ? '菜单尚未发布' : '菜品不存在或已下架'}</h1><p className="mt-2 text-sm leading-6 text-neutral-500">请返回菜单查看当前可选菜品。</p><Link to={`/m/${storeId}`} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-leaf px-5 text-sm font-medium text-white">返回店铺菜单</Link></div>}
  </main>;
}
