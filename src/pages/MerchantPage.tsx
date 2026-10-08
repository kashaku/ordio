import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Image,
  MapPin,
  Plus,
  QrCode,
  Save,
  Sparkles,
  Star,
  Store,
  Trash2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';

import { initializeOrdioData, writeOrdioData } from '../storage/ordioStorage';
import type { Dish, EditorNode, Menu, MenuTemplate, OrdioData, Store as StoreModel, StoreExtraModule } from '../types';

type MerchantStep = 'store' | 'template' | 'publish';

const steps: Array<{ id: MerchantStep; title: string; description: string }> = [
  { id: 'store', title: '编辑店铺信息', description: '评分、地点、营业时间和内容模块' },
  { id: 'template', title: '使用模板编辑菜单', description: '经典外卖点餐布局和菜品预览' },
  { id: 'publish', title: '发布二维码', description: '生成顾客端扫码入口' },
];

function getPrimaryStore(data: OrdioData): StoreModel {
  const [store] = data.stores;
  if (!store) {
    throw new Error('Mock data must include at least one store.');
  }
  return store;
}

function getStoreMenu(data: OrdioData, storeId: string, selectedMenuId: string | null): Menu {
  const menu =
    data.menus.find((item) => item.storeId === storeId && item.id === selectedMenuId) ??
    data.menus.find((item) => item.storeId === storeId);
  if (!menu) {
    throw new Error(`Mock data must include a menu for store ${storeId}.`);
  }
  return menu;
}

function getModuleTypeLabel(module: StoreExtraModule): string {
  const labels: Record<StoreExtraModule['type'], string> = {
    story: '店铺故事',
    product: '周边产品',
    brand: '品牌介绍',
    imageText: '图文模块',
  };
  return labels[module.type];
}

function formatPrice(value: number): string {
  return `¥${value.toFixed(0)}`;
}

function createExtraModule(sortOrder: number): StoreExtraModule {
  return {
    id: `module-${Date.now()}`,
    type: 'story',
    title: '新的内容模块',
    content: '补充店铺故事、周边产品或品牌介绍。',
    images: [],
    sortOrder,
  };
}

function createStoreInfoNode(storeId: string): EditorNode {
  return {
    id: `node-store-info-${Date.now()}`,
    type: 'storeInfo',
    name: '店铺简略信息',
    x: 0,
    y: 0,
    width: 375,
    height: 132,
    rotation: 0,
    zIndex: 10,
    locked: true,
    visible: true,
    binding: { kind: 'store', storeId },
  };
}

function createBlankMenu(storeId: string): Menu {
  const now = new Date().toISOString();

  return {
    id: `menu-blank-${Date.now()}`,
    storeId,
    templateId: null,
    status: 'draft',
    canvasConfig: {
      width: 375,
      height: 812,
      background: '#FAF7F0',
      gridSize: 8,
      snapToGrid: true,
      zoom: 1,
    },
    nodes: [createStoreInfoNode(storeId)],
    categories: [],
    dishes: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createMenuFromTemplate(storeId: string, template: MenuTemplate, sourceMenu: Menu): Menu {
  const now = new Date().toISOString();

  return {
    id: `menu-template-${Date.now()}`,
    storeId,
    templateId: template.id,
    status: 'draft',
    canvasConfig: template.canvasConfig,
    nodes: template.nodes.map((node) =>
      node.type === 'storeInfo' ? { ...node, binding: { kind: 'store', storeId } } : node,
    ),
    categories: sourceMenu.categories,
    dishes: sourceMenu.dishes,
    createdAt: now,
    updatedAt: now,
  };
}

export function MerchantPage() {
  const [data, setData] = useState<OrdioData>(() => initializeOrdioData());
  const [activeStep, setActiveStep] = useState<MerchantStep>('store');
  const [savedMessage, setSavedMessage] = useState('已加载本地演示数据');
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

  const store = getPrimaryStore(data);
  const storeMenus = data.menus.filter((item) => item.storeId === store.id);
  const menu = getStoreMenu(data, store.id, selectedMenuId);
  const selectedTemplate = data.templates.find((template) => template.id === menu.templateId) ?? data.templates[0];
  const customerUrl = `${window.location.origin}/m/${store.id}`;

  const sortedModules = useMemo(
    () => [...store.extraModules].sort((left, right) => left.sortOrder - right.sortOrder),
    [store.extraModules],
  );

  function persist(updater: (current: OrdioData) => OrdioData, message: string): void {
    setData((current) => {
      const nextData = updater(current);
      writeOrdioData(nextData);
      return nextData;
    });
    setSavedMessage(message);
  }

  function updateStore(patch: Partial<StoreModel>, message = '店铺信息已保存'): void {
    persist(
      (current) => ({
        ...current,
        stores: current.stores.map((item) => (item.id === store.id ? { ...item, ...patch } : item)),
      }),
      message,
    );
  }

  function updateModule(moduleId: string, patch: Partial<StoreExtraModule>): void {
    updateStore(
      {
        extraModules: store.extraModules.map((module) =>
          module.id === moduleId ? { ...module, ...patch } : module,
        ),
      },
      '内容模块已保存',
    );
  }

  function addModule(): void {
    updateStore(
      {
        extraModules: [...store.extraModules, createExtraModule(store.extraModules.length + 1)],
      },
      '已新增内容模块',
    );
  }

  function deleteModule(moduleId: string): void {
    updateStore(
      {
        extraModules: store.extraModules.filter((module) => module.id !== moduleId),
      },
      '已删除内容模块',
    );
  }

  function createEmptyMenu(): void {
    const nextMenu = createBlankMenu(store.id);

    persist(
      (current) => ({
        ...current,
        menus: [...current.menus, nextMenu],
      }),
      '已新建空白菜单',
    );
    setSelectedMenuId(nextMenu.id);
  }

  function createTemplateMenu(templateId: string): void {
    const template = data.templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    const nextMenu = createMenuFromTemplate(store.id, template, menu);

    persist(
      (current) => ({
        ...current,
        menus: [...current.menus, nextMenu],
      }),
      '已使用模板创建菜单',
    );
    setSelectedMenuId(nextMenu.id);
  }

  function publishQrCode(): void {
    persist(
      (current) => ({
        ...current,
        stores: current.stores.map((item) => (item.id === store.id ? { ...item, qrCodeUrl: `/m/${store.id}` } : item)),
        menus: current.menus.map((item) =>
          item.id === menu.id ? { ...item, status: 'published', updatedAt: new Date().toISOString() } : item,
        ),
      }),
      '二维码已发布，顾客可扫码进入菜单',
    );
  }

  return (
    <main className="min-h-screen bg-rice text-ink">
      <header className="border-b border-ink/10 bg-porcelain">
        <div className="mx-auto flex min-w-[1180px] max-w-[1440px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-porcelain">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Ordio 商家工作台</h1>
              <p className="text-sm text-ink/55">PC 端演示：店铺编辑、模板菜单、发布二维码</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-md bg-leaf/10 px-3 py-2 text-leaf">
              <CheckCircle2 className="h-4 w-4" />
              {savedMessage}
            </span>
            <a
              className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-porcelain px-3 py-2 font-medium hover:bg-rice"
              href={customerUrl}
              target="_blank"
              rel="noreferrer"
            >
              打开顾客端入口
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-w-[1180px] max-w-[1440px] grid-cols-[260px_minmax(560px,1fr)_390px] gap-6 px-8 py-6">
        <aside className="space-y-4">
          <section className="rounded-lg border border-ink/10 bg-porcelain p-4 shadow-sm">
            <p className="text-sm font-semibold">发布流程</p>
            <div className="mt-4 space-y-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  className={`w-full rounded-md border px-3 py-3 text-left transition ${
                    activeStep === step.id
                      ? 'border-ink bg-ink text-porcelain'
                      : 'border-ink/10 bg-porcelain text-ink hover:bg-rice'
                  }`}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                >
                  <span className="text-xs font-semibold">0{index + 1}</span>
                  <span className="mt-1 block text-sm font-semibold">{step.title}</span>
                  <span className={`mt-1 block text-xs ${activeStep === step.id ? 'text-porcelain/70' : 'text-ink/50'}`}>
                    {step.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-porcelain p-4 shadow-sm">
            <p className="text-sm font-semibold">当前状态</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/55">店铺</dt>
                <dd className="font-medium">{store.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/55">菜单</dt>
                <dd className="font-medium">{menu.status === 'published' ? '已发布' : '草稿'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/55">模板</dt>
                <dd className="font-medium">{selectedTemplate?.name ?? '未选择'}</dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="space-y-6">
          {activeStep === 'store' ? (
            <StoreEditor
              modules={sortedModules}
              store={store}
              onAddModule={addModule}
              onDeleteModule={deleteModule}
              onUpdateModule={updateModule}
              onUpdateStore={updateStore}
            />
          ) : null}

          {activeStep === 'template' ? (
            <MenuManager
              menu={menu}
              menus={storeMenus}
              selectedTemplateId={menu.templateId}
              templates={data.templates}
              onCreateBlankMenu={createEmptyMenu}
              onCreateTemplateMenu={createTemplateMenu}
              onSelectMenu={setSelectedMenuId}
            />
          ) : null}

          {activeStep === 'publish' ? (
            <PublishPanel customerUrl={customerUrl} menu={menu} store={store} onPublish={publishQrCode} />
          ) : null}
        </section>

        <aside className="space-y-4">
          <PhonePreview menu={menu} store={store} />
          <section className="rounded-lg border border-ink/10 bg-porcelain p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">扫码入口</p>
                <p className="mt-1 text-xs text-ink/50">发布后顾客进入此店铺菜单</p>
              </div>
              <QrCode className="h-5 w-5 text-leaf" />
            </div>
            <div className="mt-4 flex justify-center rounded-lg bg-rice p-4">
              <QRCodeSVG value={customerUrl} size={148} marginSize={1} />
            </div>
            <p className="mt-3 break-all text-xs leading-5 text-ink/55">{customerUrl}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

interface StoreEditorProps {
  store: StoreModel;
  modules: StoreExtraModule[];
  onUpdateStore: (patch: Partial<StoreModel>, message?: string) => void;
  onUpdateModule: (moduleId: string, patch: Partial<StoreExtraModule>) => void;
  onAddModule: () => void;
  onDeleteModule: (moduleId: string) => void;
}

function StoreEditor({
  modules,
  store,
  onAddModule,
  onDeleteModule,
  onUpdateModule,
  onUpdateStore,
}: StoreEditorProps) {
  return (
    <>
      <section className="rounded-lg border border-ink/10 bg-porcelain p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">店铺信息</h2>
            <p className="mt-1 text-sm text-ink/55">这些信息会默认出现在菜单顶部，评分和地点不可缺失。</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md bg-leaf/10 px-3 py-2 text-sm text-leaf">
            <Save className="h-4 w-4" />
            自动保存到本地
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <TextField label="店铺名称" value={store.name} onChange={(value) => onUpdateStore({ name: value })} />
          <NumberField
            label="评分"
            max={5}
            min={0}
            step={0.1}
            value={store.rating}
            onChange={(value) => onUpdateStore({ rating: value })}
          />
          <TextField label="地点" value={store.location} onChange={(value) => onUpdateStore({ location: value })} />
          <TextField
            label="营业时间"
            value={store.businessHours}
            onChange={(value) => onUpdateStore({ businessHours: value })}
          />
          <TextField label="电话" value={store.phone} onChange={(value) => onUpdateStore({ phone: value })} />
          <TextField label="地址" value={store.address} onChange={(value) => onUpdateStore({ address: value })} />
          <TextareaField
            label="简介"
            value={store.description}
            onChange={(value) => onUpdateStore({ description: value })}
          />
          <TextareaField label="店铺故事" value={store.story} onChange={(value) => onUpdateStore({ story: value })} />
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-porcelain p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">额外内容模块</h2>
            <p className="mt-1 text-sm text-ink/55">用于店铺故事、周边产品、品牌介绍等 PC 编辑内容。</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-porcelain hover:bg-ink/90"
            type="button"
            onClick={onAddModule}
          >
            <Plus className="h-4 w-4" />
            新增模块
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {modules.map((module) => (
            <div key={module.id} className="rounded-lg border border-ink/10 bg-rice p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-md bg-porcelain px-2 py-1 text-xs font-medium text-ink/60">
                  {getModuleTypeLabel(module)}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-clay hover:bg-clay/10"
                  type="button"
                  onClick={() => onDeleteModule(module.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </button>
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-3">
                <TextField
                  label="标题"
                  value={module.title}
                  onChange={(value) => onUpdateModule(module.id, { title: value })}
                />
                <TextField
                  label="内容"
                  value={module.content}
                  onChange={(value) => onUpdateModule(module.id, { content: value })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

interface MenuManagerProps {
  menu: Menu;
  menus: Menu[];
  selectedTemplateId: string | null;
  templates: OrdioData['templates'];
  onCreateBlankMenu: () => void;
  onCreateTemplateMenu: (templateId: string) => void;
  onSelectMenu: (menuId: string) => void;
}

function MenuManager({
  menu,
  menus,
  onCreateBlankMenu,
  onCreateTemplateMenu,
  onSelectMenu,
  selectedTemplateId,
  templates,
}: MenuManagerProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-porcelain p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">菜单管理</h2>
            <p className="mt-1 text-sm text-ink/55">管理菜单草稿，支持新建空白菜单或使用内置模板快速创建。</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-porcelain hover:bg-ink/90"
            type="button"
            onClick={onCreateBlankMenu}
          >
            <Plus className="h-4 w-4" />
            新建空白菜单
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {menus.map((item) => (
            <button
              key={item.id}
              className={`grid grid-cols-[1fr_auto] rounded-lg border p-4 text-left transition ${
                item.id === menu.id ? 'border-ink bg-rice' : 'border-ink/10 bg-porcelain hover:bg-rice'
              }`}
              type="button"
              onClick={() => onSelectMenu(item.id)}
            >
              <span>
                <span className="block text-sm font-semibold">
                  {item.templateId ? '模板菜单' : '空白菜单'} · {item.id}
                </span>
                <span className="mt-1 block text-xs text-ink/50">
                  {item.categories.length} 个分类 / {item.dishes.length} 个菜品 / {item.nodes.length} 个画布组件
                </span>
              </span>
              <span className="rounded-md bg-porcelain px-2 py-1 text-xs text-ink/55">
                {item.status === 'published' ? '已发布' : '草稿'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-porcelain p-5 shadow-sm">
        <h2 className="text-xl font-semibold">内置模板</h2>
        <p className="mt-1 text-sm text-ink/55">
          模板采用经典外卖点餐布局：顶部店铺信息、左侧分类、右侧菜品列表、底部购物车栏和加购按钮。
        </p>

        <div className="mt-5 grid gap-4">
          {templates.map((template) => (
            <article
              key={template.id}
              className={`grid grid-cols-[220px_1fr_auto] gap-4 rounded-lg border p-4 ${
                selectedTemplateId === template.id ? 'border-leaf bg-leaf/5' : 'border-ink/10 bg-rice'
              }`}
            >
              <div className="rounded-lg border border-ink/10 bg-porcelain p-3">
                <div className="rounded-md bg-rice p-2">
                  <div className="mb-2 h-12 rounded bg-ink text-[10px] font-semibold text-porcelain">
                    <div className="flex h-full items-center px-3">评分 · 地点 · 店铺信息</div>
                  </div>
                  <div className="grid grid-cols-[48px_1fr] gap-2">
                    <div className="space-y-2">
                      <div className="h-6 rounded bg-citrus" />
                      <div className="h-6 rounded bg-ink/10" />
                      <div className="h-6 rounded bg-ink/10" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-10 rounded bg-porcelain" />
                      <div className="h-10 rounded bg-porcelain" />
                      <div className="h-10 rounded bg-porcelain" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-ink/60">{template.description}</p>
                <div className="mt-4 flex gap-2 text-xs text-ink/55">
                  <span className="rounded-md bg-porcelain px-2 py-1">顶部店铺信息</span>
                  <span className="rounded-md bg-porcelain px-2 py-1">分类导航</span>
                  <span className="rounded-md bg-porcelain px-2 py-1">菜品列表</span>
                  <span className="rounded-md bg-porcelain px-2 py-1">购物车栏</span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <span className="rounded-md bg-porcelain px-2 py-1 text-xs text-ink/55">
                  {template.nodes.length} 个默认组件
                </span>
                <button
                  className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-porcelain hover:bg-ink/90"
                  type="button"
                  onClick={() => onCreateTemplateMenu(template.id)}
                >
                  用模板创建菜单
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

interface PublishPanelProps {
  customerUrl: string;
  menu: Menu;
  store: StoreModel;
  onPublish: () => void;
}

function PublishPanel({ customerUrl, menu, onPublish, store }: PublishPanelProps) {
  return (
    <section className="rounded-lg border border-ink/10 bg-porcelain p-5 shadow-sm">
      <h2 className="text-xl font-semibold">发布二维码</h2>
      <p className="mt-1 text-sm text-ink/55">顾客扫码后会进入对应店铺菜单页面。当前只生成本地演示链接。</p>

      <div className="mt-5 grid grid-cols-[240px_1fr] gap-5">
        <div className="rounded-lg bg-rice p-5">
          <div className="flex justify-center rounded-lg bg-porcelain p-5">
            <QRCodeSVG value={customerUrl} size={176} marginSize={1} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-ink/10 p-4">
            <p className="text-sm font-semibold">{store.name}</p>
            <p className="mt-2 break-all text-sm leading-6 text-ink/60">{customerUrl}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Metric label="菜单状态" value={menu.status === 'published' ? '已发布' : '草稿'} />
            <Metric label="菜品数量" value={`${menu.dishes.length} 个`} />
            <Metric label="分类数量" value={`${menu.categories.length} 个`} />
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-citrus px-4 py-3 text-sm font-semibold text-ink hover:bg-citrus/90"
            type="button"
            onClick={onPublish}
          >
            <QrCode className="h-4 w-4" />
            发布二维码
          </button>
        </div>
      </div>
    </section>
  );
}

interface PhonePreviewProps {
  store: StoreModel;
  menu: Menu;
}

function PhonePreview({ menu, store }: PhonePreviewProps) {
  const firstCategory = [...menu.categories].sort((left, right) => left.sortOrder - right.sortOrder)[0];
  const visibleDishes = firstCategory
    ? menu.dishes.filter((dish) => dish.categoryId === firstCategory.id)
    : menu.dishes;

  return (
    <section className="rounded-lg border border-ink/10 bg-porcelain p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">顾客端手机预览</p>
          <p className="text-xs text-ink/50">商家端是 PC 页面，此处仅用于实时预览</p>
        </div>
        <Sparkles className="h-5 w-5 text-citrus" />
      </div>

      <div className="mx-auto h-[760px] w-[350px] overflow-hidden rounded-[28px] border-[10px] border-ink bg-rice shadow-xl">
        <div className="bg-ink px-4 pb-4 pt-5 text-porcelain">
          <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-citrus to-leaf" />
          <h3 className="text-xl font-semibold">{store.name}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-porcelain/80">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-citrus text-citrus" />
              {store.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {store.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {store.businessHours}
            </span>
          </div>
        </div>

        <div className="grid h-[480px] grid-cols-[82px_1fr]">
          <nav className="bg-ink/5">
            {menu.categories.map((category) => (
              <div
                key={category.id}
                className={`px-3 py-4 text-sm ${
                  category.id === firstCategory?.id ? 'bg-porcelain font-semibold text-ink' : 'text-ink/55'
                }`}
              >
                {category.name}
              </div>
            ))}
          </nav>
          <div className="space-y-3 overflow-hidden bg-porcelain p-3">
            {visibleDishes.map((dish) => (
              <DishPreviewCard key={dish.id} dish={dish} />
            ))}
          </div>
        </div>

        <div className="m-3 flex h-14 items-center justify-between rounded-full bg-ink px-4 text-porcelain">
          <div>
            <p className="text-sm font-semibold">购物车</p>
            <p className="text-xs text-porcelain/60">顾客端下个任务实现</p>
          </div>
          <button className="rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-ink" type="button">
            去结算
          </button>
        </div>
      </div>
    </section>
  );
}

function DishPreviewCard({ dish }: { dish: Dish }) {
  return (
    <article className="grid grid-cols-[64px_1fr] gap-3 rounded-lg border border-ink/5 bg-porcelain p-2 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-rice">
        <Image className="h-5 w-5 text-ink/35" />
      </div>
      <div className="min-w-0">
        <h4 className="truncate text-sm font-semibold">{dish.name}</h4>
        <p className="mt-1 line-clamp-2 text-xs leading-4 text-ink/50">{dish.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-clay">{formatPrice(dish.price)}</span>
          <button className="rounded-full bg-citrus px-2.5 py-1 text-xs font-semibold text-ink" type="button">
            加购
          </button>
        </div>
      </div>
    </article>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TextField({ label, onChange, value }: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/55">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-ink/10 bg-porcelain px-3 py-2 text-sm outline-none ring-leaf/30 focus:border-leaf focus:ring-4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

function NumberField({ label, max, min, onChange, step, value }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/55">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-ink/10 bg-porcelain px-3 py-2 text-sm outline-none ring-leaf/30 focus:border-leaf focus:ring-4"
        max={max}
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TextareaField({ label, onChange, value }: TextareaFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/55">{label}</span>
      <textarea
        className="mt-1 min-h-24 w-full resize-none rounded-md border border-ink/10 bg-porcelain px-3 py-2 text-sm leading-6 outline-none ring-leaf/30 focus:border-leaf focus:ring-4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-rice p-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
