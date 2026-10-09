import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Clock, ImageIcon, MapPin, Minus, Plus, ShoppingBag, Star, Store as StoreIcon, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { readOrdioData } from '../storage/ordioStorage';
import { cartItemKey, dishPriceInCents, useCartStore } from '../state/cartStore';
import type { Dish, SelectedSpec } from '../types/domain';

function money(cents: number): string {
  return `¥${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
}

function DishImage({ src, name }: { src: string; name: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-100 text-neutral-400">
      {src && failedSource !== src
        ? <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailedSource(src)} />
        : <ImageIcon size={28} aria-label={`${name}暂无图片`} />}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} aria-labelledby="customer-sheet-title" onCancel={onClose}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[85dvh] w-full max-w-[480px] overflow-y-auto rounded-t-lg bg-white p-0 text-ink shadow-xl backdrop:bg-black/40"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-3">
        <h2 id="customer-sheet-title" className="font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="关闭" title="关闭" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-neutral-100"><X size={20} /></button>
      </div>
      <div className="p-5 pb-[max(20px,env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  );
}

function SpecPicker({ dish, onClose, onAdd }: { dish: Dish; onClose: () => void; onAdd: (specs: SelectedSpec[]) => void }) {
  const [specs, setSpecs] = useState<SelectedSpec[]>(() => dish.specs.flatMap((group) =>
    group.required && group.options[0] ? [{ groupId: group.id, optionId: group.options[0].id }] : [],
  ));
  const valid = dish.specs.every((group) => !group.required || specs.some((spec) => spec.groupId === group.id));
  return (
    <Sheet title={dish.name} onClose={onClose}>
      <p className="mb-4 text-sm leading-6 text-neutral-500">{dish.description}</p>
      {dish.specs.map((group) => (
        <fieldset key={group.id} className="mb-5">
          <legend className="mb-2 text-sm font-medium">{group.name} {group.required ? '（必选）' : '（可选）'}</legend>
          <div className="flex flex-wrap gap-2">
            {!group.required && <label className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm">
              <input type="radio" name={group.id} checked={!specs.some((spec) => spec.groupId === group.id)}
                onChange={() => setSpecs(specs.filter((spec) => spec.groupId !== group.id))} />不选
            </label>}
            {group.options.map((option) => <label key={option.id} className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm has-[:checked]:border-leaf has-[:checked]:bg-green-50">
              <input type="radio" name={group.id} checked={specs.some((spec) => spec.groupId === group.id && spec.optionId === option.id)}
                onChange={() => setSpecs([...specs.filter((spec) => spec.groupId !== group.id), { groupId: group.id, optionId: option.id }])} />
              {option.name}{option.priceDelta !== 0 && ` ${option.priceDelta > 0 ? '+' : ''}${money(Math.round(option.priceDelta * 100))}`}
            </label>)}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center justify-between gap-4 border-t pt-4">
        <strong className="text-xl text-clay">{money(dishPriceInCents(dish, specs))}</strong>
        <button type="button" disabled={!valid} onClick={() => { onAdd(specs); onClose(); }} className="flex min-h-11 items-center gap-2 rounded-lg bg-citrus px-4 font-medium disabled:opacity-40"><Plus size={18} />加入购物车</button>
      </div>
    </Sheet>
  );
}

const emptyCart: never[] = [];

export function CustomerPage() {
  const { storeId = '' } = useParams();
  const [data, setData] = useState(readOrdioData);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const items = useCartStore((state) => state.carts[storeId] ?? emptyCart);
  const add = useCartStore((state) => state.add);
  const changeQuantity = useCartStore((state) => state.changeQuantity);
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    const refresh = () => setData(readOrdioData());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const store = data.stores.find((item) => item.id === storeId);
  const menu = data.menus.filter((item) => item.storeId === storeId && item.status === 'published')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const categories = [...(menu?.categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const categoryId = categories.some((item) => item.id === activeCategory) ? activeCategory : categories[0]?.id;
  const dishes = menu?.dishes.filter((dish) => dish.categoryId === categoryId) ?? [];
  // Deleted dishes and invalid selections must not contribute to the current menu's totals.
  const cart = items.flatMap((item) => {
    const dish = menu?.dishes.find((candidate) => candidate.id === item.dishId);
    if (!dish || item.specs.some((spec) => !dish.specs.some((group) => group.id === spec.groupId && group.options.some((option) => option.id === spec.optionId)))
      || dish.specs.some((group) => group.required && !item.specs.some((spec) => spec.groupId === group.id))) return [];
    return [{ ...item, dish, key: cartItemKey(item.dishId, item.specs), unitPrice: dishPriceInCents(dish, item.specs) }];
  });
  const quantity = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (!store) return <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-3 bg-white px-6 text-center"><StoreIcon size={36} className="text-neutral-400" /><h1 className="text-xl font-semibold">店铺不存在</h1><p className="text-sm text-neutral-500">请使用商家提供的店铺二维码重新进入。</p></main>;

  return (
    <main className="mx-auto min-h-dvh max-w-[480px] bg-white font-sans text-ink shadow-sm">
      <header className="border-b border-neutral-200">
        {store.cover && <div className="h-36 overflow-hidden"><img src={store.cover} alt={`${store.name}封面`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.parentElement?.setAttribute('hidden', ''); }} /></div>}
        <div className="px-5 py-5">
          <div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-leaf text-white"><StoreIcon size={25} /></div><div className="min-w-0"><h1 className="break-words text-2xl font-bold">{store.name}</h1><p className="mt-1 text-sm leading-5 text-neutral-500">{store.description}</p></div></div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="flex items-center gap-1 font-semibold"><Star size={14} className="fill-citrus text-citrus" />{store.rating.toFixed(1)}</span>
            <span className="flex min-w-0 items-start gap-1 text-neutral-600"><MapPin size={14} className="shrink-0" />{store.location}</span>
            <span className="flex items-center gap-1 text-neutral-600"><Clock size={14} />{store.businessHours}</span>
          </div>
        </div>
      </header>
      {!menu ? <p className="px-5 py-16 text-center text-sm text-neutral-500">菜单尚未发布，请稍后再来。</p> : <>
        <div className="border-b px-5 py-3 font-semibold text-leaf">点餐 <span className="ml-2 text-xs font-normal text-neutral-400">{menu.dishes.length} 道菜品</span></div>
        <div className="grid min-h-[calc(100dvh-260px)] grid-cols-[80px_minmax(0,1fr)] pb-[calc(100px+env(safe-area-inset-bottom))]">
          <nav aria-label="菜品分类" className="bg-neutral-100">
            <div className="sticky top-0 max-h-[calc(100dvh-100px)] overflow-y-auto">
              {categories.map((category) => <button key={category.id} type="button" aria-pressed={category.id === categoryId}
                onClick={() => setActiveCategory(category.id)} className={`min-h-14 w-full break-words border-l-[3px] px-2 py-4 text-left text-sm ${category.id === categoryId ? 'border-leaf bg-white font-semibold text-leaf' : 'border-transparent text-neutral-600'}`}>{category.name}</button>)}
            </div>
          </nav>
          <section aria-label="菜品列表" className="min-w-0 px-3">
            <h2 className="py-4 text-sm font-semibold">{categories.find((item) => item.id === categoryId)?.name ?? '菜单'}</h2>
            {dishes.length === 0 && <p className="py-8 text-sm text-neutral-500">暂无菜品</p>}
            {dishes.map((dish) => {
              const count = cart.filter((item) => item.dishId === dish.id).reduce((sum, item) => sum + item.quantity, 0);
              return <article key={dish.id} className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 border-b border-neutral-100 py-4 first:pt-0">
                <DishImage src={dish.image} name={dish.name} />
                <div className="min-w-0"><h3 className="break-words text-sm font-semibold leading-5">{dish.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">{dish.description}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">月售 {dish.sales}</p>
                  <div className="mt-1 flex flex-wrap gap-1">{dish.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded border border-green-100 px-1 text-[10px] text-leaf">{tag}</span>)}</div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1"><strong className="text-base text-clay">{money(Math.round(dish.price * 100))}</strong><div className="flex items-center gap-1">
                    {count > 0 && <span aria-label={`已选${count}份`} className="text-xs text-neutral-500">{count}份</span>}
                    <button type="button" aria-label={`${dish.specs.length ? '选择规格' : '加购'} ${dish.name}`} title={`加购 ${dish.name}`}
                      onClick={() => dish.specs.length ? setSelectedDish(dish) : add(storeId, dish.id, [])}
                      className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg bg-citrus px-2 text-xs font-medium">
                      {dish.specs.length ? '选规格' : <Plus size={18} />}
                    </button>
                  </div></div>
                </div>
              </article>;
            })}
          </section>
        </div>
        <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[480px] items-center gap-3 border-t border-neutral-200 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <button type="button" onClick={() => setCartOpen(true)} title="打开购物车" aria-label={`购物车，${quantity}份`} className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink text-white"><ShoppingBag size={23} />{quantity > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-citrus px-1.5 text-xs font-semibold text-ink">{quantity}</span>}</button>
          <div className="min-w-0 flex-1"><strong className="block truncate text-lg">{money(total)}</strong><span className="text-xs text-neutral-500">{quantity ? `已选 ${quantity} 份` : '还没有选择菜品'}</span></div>
          <button type="button" onClick={() => setCartOpen(true)} className="min-h-12 shrink-0 rounded-lg bg-citrus px-3 text-sm font-semibold">查看购物车</button>
        </footer>
      </>}
      {selectedDish && <SpecPicker key={selectedDish.id} dish={selectedDish} onClose={() => setSelectedDish(null)} onAdd={(specs) => add(storeId, selectedDish.id, specs)} />}
      {cartOpen && <Sheet title="购物车" onClose={() => setCartOpen(false)}>
        {cart.length === 0 ? <div className="py-10 text-center"><ShoppingBag className="mx-auto mb-3 text-neutral-300" size={32} /><p className="text-sm text-neutral-500">购物车是空的，选几道喜欢的菜吧。</p></div> : <>
          <button type="button" onClick={() => clear(storeId)} className="mb-3 ml-auto flex min-h-11 items-center gap-2 text-sm text-neutral-500"><Trash2 size={16} />清空购物车</button>
          {cart.map((item) => <div key={item.key} className="flex gap-3 border-b py-4">
            <div className="w-14 shrink-0"><DishImage src={item.dish.image} name={item.dish.name} /></div>
            <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{item.dish.name}</h3><p className="mt-1 text-xs text-neutral-500">{item.specs.map((spec) => item.dish.specs.find((group) => group.id === spec.groupId)?.options.find((option) => option.id === spec.optionId)?.name).join(' / ')}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-clay">{money(item.unitPrice * item.quantity)}</span><div className="flex items-center gap-2">
                <button type="button" aria-label={`减少 ${item.dish.name}`} onClick={() => changeQuantity(storeId, item.key, -1)} className="flex h-11 w-11 items-center justify-center rounded-lg border"><Minus size={16} /></button>
                <span className="min-w-4 text-center text-sm">{item.quantity}</span>
                <button type="button" aria-label={`增加 ${item.dish.name}`} onClick={() => changeQuantity(storeId, item.key, 1)} className="flex h-11 w-11 items-center justify-center rounded-lg bg-citrus"><Plus size={16} /></button>
              </div></div>
            </div>
          </div>)}
          <div className="mt-5 flex items-center justify-between"><span className="text-sm">共 {quantity} 份</span><strong className="text-lg">合计 {money(total)}</strong></div>
        </>}
        <button type="button" onClick={() => setCartOpen(false)} className="mt-5 min-h-11 w-full rounded-lg bg-leaf text-sm font-medium text-white">继续选菜</button>
      </Sheet>}
    </main>
  );
}
