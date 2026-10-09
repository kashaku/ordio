import { createContext, useContext, useState, type ReactNode } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Dish, Menu, TemplateComponentNode } from '../../types/domain';
import { DishImage } from '../customer/DishImage';

interface LayoutState {
  menu: Menu;
  interactive: boolean;
  categoryId: string;
  selectCategory: (id: string) => void;
  quantities: Record<string, number>;
  changeQuantity: (id: string, delta: number) => void;
}

const LayoutContext = createContext<LayoutState | null>(null);

export function MenuLayoutProvider({ menu, interactive = false, children }: { menu: Menu; interactive?: boolean; children: ReactNode }) {
  const [selectedCategory, selectCategory] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const categoryId = menu.categories.some((category) => category.id === selectedCategory) ? selectedCategory : '';
  return <LayoutContext.Provider value={{ menu, interactive, categoryId, selectCategory, quantities,
    changeQuantity: (id, delta) => setQuantities((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) })),
  }}>{children}</LayoutContext.Provider>;
}

function price(value: number): string { return `¥${value.toFixed(2).replace(/\.00$/, '')}`; }

function LayoutDish({ dish, state }: { dish: Dish; state: LayoutState }) {
  const quantity = state.quantities[dish.id] ?? 0;
  return <article aria-label={dish.name} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 border-b border-neutral-100 bg-white py-3">
    <div className="w-16 self-start"><DishImage src={dish.image} name={dish.name} /></div>
    <div className="min-w-0">
      <h3 className="break-words text-sm font-semibold leading-5">{dish.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-4 text-neutral-500">{dish.description}</p>
      <p className="mt-1 text-[10px] text-neutral-400">月售 {dish.sales}</p>
      <div className="mt-1 flex flex-wrap gap-1">{dish.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded border border-green-100 px-1 text-[10px] text-leaf">{tag}</span>)}</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
        <strong className="text-sm text-clay">{price(dish.price)}</strong>
        <div className="flex items-center gap-1">
          {quantity > 0 && <><button type="button" disabled={!state.interactive} aria-label={`减少 ${dish.name}`} title={`减少 ${dish.name}`} onClick={() => state.changeQuantity(dish.id, -1)} className="flex h-7 w-7 items-center justify-center rounded border"><Minus size={14} /></button><span className="min-w-4 text-center text-xs">{quantity}</span></>}
          <button type="button" disabled={!state.interactive} aria-label={`加购 ${dish.name}`} title={`加购 ${dish.name}`} onClick={() => state.changeQuantity(dish.id, 1)} className="flex h-7 w-7 items-center justify-center rounded bg-citrus"><Plus size={15} /></button>
        </div>
      </div>
    </div>
  </article>;
}

export function MenuLayoutNode({ node }: { node: TemplateComponentNode }) {
  const state = useContext(LayoutContext);
  if (!state) return null;
  const { menu } = state;
  const categories = [...menu.categories].sort((left, right) => left.sortOrder - right.sortOrder);
  const bindingCategory = node.binding.kind === 'category' ? node.binding.categoryId : '';
  const sidebar = menu.nodes.find((item) => item.type === 'categorySidebar');
  const defaultCategory = sidebar && 'binding' in sidebar && sidebar.binding.kind === 'category' ? sidebar.binding.categoryId : '';
  const categoryId = state.categoryId || bindingCategory || defaultCategory || categories[0]?.id;

  if (node.type === 'categorySidebar') return <nav aria-label="预览菜品分类" className="h-full overflow-y-auto bg-neutral-100">
    {categories.length === 0 && <p className="p-3 text-xs text-neutral-500">暂无分类</p>}
    {categories.map((category) => <button type="button" key={category.id} disabled={!state.interactive} aria-pressed={category.id === categoryId} onClick={() => state.selectCategory(category.id)}
      className={`min-h-14 w-full break-words border-l-[3px] px-2 py-3 text-left text-xs ${category.id === categoryId ? 'border-leaf bg-white font-semibold text-leaf' : 'border-transparent text-neutral-600'}`}>{category.name}</button>)}
  </nav>;

  if (node.type === 'dishList') {
    const category = categories.find((item) => item.id === categoryId);
    const dishes = menu.dishes.filter((dish) => dish.categoryId === categoryId);
    return <section aria-label="预览菜品列表" className="h-full overflow-y-auto bg-white px-3">
      <h2 className="sticky top-0 z-10 bg-white py-3 text-sm font-semibold">{category?.name ?? '菜品列表'}</h2>
      {dishes.length === 0 ? <p className="py-6 text-xs text-neutral-500">暂无菜品</p> : dishes.map((dish) => <LayoutDish key={dish.id} dish={dish} state={state} />)}
    </section>;
  }

  if (node.type === 'dishCard') {
    const dishId = node.binding.kind === 'dish' ? node.binding.dishId : '';
    const dish = menu.dishes.find((item) => item.id === dishId);
    return <div className="h-full overflow-y-auto bg-white px-2">{dish ? <LayoutDish dish={dish} state={state} /> : <p className="p-3 text-xs text-neutral-500">未绑定菜品或菜品已删除</p>}</div>;
  }

  if (node.type === 'cartBar') {
    const quantity = menu.dishes.reduce((sum, dish) => sum + (state.quantities[dish.id] ?? 0), 0);
    const totalInCents = menu.dishes.reduce((sum, dish) => sum + Math.round(dish.price * 100) * (state.quantities[dish.id] ?? 0), 0);
    return <div aria-label="预览购物车" className="flex h-full items-center gap-2 bg-ink px-3 text-white">
      <ShoppingBag size={22} className="shrink-0" />
      <div className="min-w-0 flex-1"><strong className="block text-sm">{price(totalInCents / 100)}</strong><p className="text-[10px] text-white/70">{quantity ? `已选 ${quantity} 份` : '还没有选择菜品'}</p></div>
      {state.interactive && quantity > 0 && <button type="button" onClick={() => menu.dishes.forEach((dish) => state.changeQuantity(dish.id, -(state.quantities[dish.id] ?? 0)))} className="min-h-9 shrink-0 px-2 text-xs">清空</button>}
    </div>;
  }
  return null;
}
