import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Grid3X3,
  Image,
  Layers,
  MapPin,
  MousePointer2,
  Plus,
  QrCode,
  Redo2,
  RotateCw,
  Save,
  Sparkles,
  Star,
  Store,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { MouseEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { initializeOrdioData, writeOrdioData } from '../storage/ordioStorage';
import type { Dish, EditorNode, Menu, MenuTemplate, OrdioData, Store as StoreModel, StoreExtraModule } from '../types';

type MerchantStep = 'store' | 'template' | 'editor' | 'publish';
type NodePatch = Partial<{
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  color: string;
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
  background: string;
  borderColor: string;
  borderRadius: number;
  childNodeIds: string[];
}>;

const steps: Array<{ id: MerchantStep; title: string; description: string }> = [
  { id: 'store', title: '编辑店铺信息', description: '评分、地点、营业时间和内容模块' },
  { id: 'template', title: '使用模板编辑菜单', description: '经典外卖点餐布局和菜品预览' },
  { id: 'editor', title: '菜单编辑器', description: '组件、图层、画布和属性面板' },
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

function ensureStoreInfoNode(menu: Menu, storeId: string): Menu {
  const hasStoreInfo = menu.nodes.some((node) => node.type === 'storeInfo');
  if (hasStoreInfo) {
    return menu;
  }

  return {
    ...menu,
    nodes: [createStoreInfoNode(storeId), ...menu.nodes],
  };
}

function applyNodePatch(node: EditorNode, patch: NodePatch): EditorNode {
  return { ...node, ...patch } as EditorNode;
}

function createInsertedNode(type: 'text' | 'image' | 'rect' | 'container' | 'storeInfo', storeId: string): EditorNode {
  const base = {
    id: `node-${type}-${Date.now()}`,
    name:
      type === 'text'
        ? '文本'
        : type === 'image'
          ? '图片'
          : type === 'rect'
            ? '矩形'
            : type === 'container'
              ? '容器'
              : '店铺简略信息',
    x: type === 'storeInfo' ? 0 : 96,
    y: type === 'storeInfo' ? 0 : 180,
    width: type === 'storeInfo' ? 375 : 160,
    height: type === 'storeInfo' ? 132 : 88,
    rotation: 0,
    zIndex: 80,
    locked: type === 'storeInfo',
    visible: true,
  };

  if (type === 'text') {
    return {
      ...base,
      type,
      text: '新文本',
      fontSize: 18,
      fontWeight: 'semibold',
      color: '#171717',
    };
  }

  if (type === 'image') {
    return {
      ...base,
      type,
      src: '',
      alt: '自定义图片',
      objectFit: 'cover',
    };
  }

  if (type === 'rect') {
    return {
      ...base,
      type,
      fill: '#F5B000',
      stroke: '#171717',
      strokeWidth: 1,
      radius: 8,
    };
  }

  if (type === 'container') {
    return {
      ...base,
      type,
      background: '#FFFFFF',
      borderColor: '#E7E0D2',
      borderRadius: 8,
      childNodeIds: [],
    };
  }

  return {
    ...base,
    type,
    binding: { kind: 'store', storeId },
  };
}

export function MerchantPage() {
  const [data, setData] = useState<OrdioData>(() => initializeOrdioData());
  const [activeStep, setActiveStep] = useState<MerchantStep>('store');
  const [savedMessage, setSavedMessage] = useState('已加载本地演示数据');
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [clipboardNode, setClipboardNode] = useState<EditorNode | null>(null);
  const [undoStack, setUndoStack] = useState<Menu[]>([]);
  const [redoStack, setRedoStack] = useState<Menu[]>([]);

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

  function replaceCurrentMenu(nextMenu: Menu, message: string, shouldTrackHistory = true): void {
    if (shouldTrackHistory) {
      setUndoStack((current) => [...current, menu]);
      setRedoStack([]);
    }

    persist(
      (current) => ({
        ...current,
        menus: current.menus.map((item) =>
          item.id === menu.id
            ? ensureStoreInfoNode({ ...nextMenu, updatedAt: new Date().toISOString() }, store.id)
            : item,
        ),
      }),
      message,
    );
  }

  function updateCurrentMenu(updater: (currentMenu: Menu) => Menu, message: string, shouldTrackHistory = true): void {
    replaceCurrentMenu(updater(menu), message, shouldTrackHistory);
  }

  function updateNode(nodeId: string, patch: NodePatch, message = '画布节点已更新', shouldTrackHistory = true): void {
    updateCurrentMenu(
      (currentMenu) => ({
        ...currentMenu,
        nodes: currentMenu.nodes.map((node) => (node.id === nodeId ? applyNodePatch(node, patch) : node)),
      }),
      message,
      shouldTrackHistory,
    );
  }

  function insertNode(type: 'text' | 'image' | 'rect' | 'container' | 'storeInfo'): void {
    if (type === 'storeInfo' && menu.nodes.some((node) => node.type === 'storeInfo')) {
      setSelectedNodeId(menu.nodes.find((node) => node.type === 'storeInfo')?.id ?? null);
      setSavedMessage('店铺简略信息组件已存在');
      return;
    }

    const nextNode = createInsertedNode(type, store.id);
    updateCurrentMenu(
      (currentMenu) => ({
        ...currentMenu,
        nodes: [...currentMenu.nodes, nextNode],
      }),
      '已插入画布组件',
    );
    setSelectedNodeId(nextNode.id);
  }

  function deleteSelectedNode(): void {
    const selectedNode = menu.nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode) {
      return;
    }
    if (selectedNode.type === 'storeInfo') {
      setSavedMessage('店铺简略信息组件不可删除');
      return;
    }

    updateCurrentMenu(
      (currentMenu) => ({
        ...currentMenu,
        nodes: currentMenu.nodes.filter((node) => node.id !== selectedNode.id),
      }),
      '已删除画布节点',
    );
    setSelectedNodeId(null);
  }

  function copySelectedNode(): void {
    const selectedNode = menu.nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode) {
      return;
    }
    setClipboardNode(selectedNode);
    setSavedMessage('已复制节点');
  }

  function pasteNode(): void {
    if (!clipboardNode) {
      return;
    }
    const pastedNode = {
      ...clipboardNode,
      id: `node-copy-${Date.now()}`,
      name: `${clipboardNode.name} 副本`,
      x: clipboardNode.x + 16,
      y: clipboardNode.y + 16,
      locked: false,
    } as EditorNode;

    updateCurrentMenu(
      (currentMenu) => ({
        ...currentMenu,
        nodes: [...currentMenu.nodes, pastedNode],
      }),
      '已粘贴节点',
    );
    setSelectedNodeId(pastedNode.id);
  }

  function undoEditorChange(): void {
    const previousMenu = undoStack.at(-1);
    if (!previousMenu) {
      return;
    }
    setUndoStack((current) => current.slice(0, -1));
    setRedoStack((current) => [...current, menu]);
    replaceCurrentMenu(previousMenu, '已撤销上一步', false);
  }

  function redoEditorChange(): void {
    const nextMenu = redoStack.at(-1);
    if (!nextMenu) {
      return;
    }
    setRedoStack((current) => current.slice(0, -1));
    setUndoStack((current) => [...current, menu]);
    replaceCurrentMenu(nextMenu, '已重做上一步', false);
  }

  function publishCurrentMenu(): void {
    updateCurrentMenu((currentMenu) => ({ ...currentMenu, status: 'published' }), '菜单已发布');
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

      <div
        className={`mx-auto grid min-w-[1180px] gap-6 px-8 py-6 ${
          activeStep === 'editor'
            ? 'max-w-[1680px] grid-cols-[260px_minmax(900px,1fr)]'
            : 'max-w-[1440px] grid-cols-[260px_minmax(560px,1fr)_390px]'
        }`}
      >
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

          {activeStep === 'editor' ? (
            <MenuEditor
              canRedo={redoStack.length > 0}
              canUndo={undoStack.length > 0}
              menu={menu}
              selectedNodeId={selectedNodeId}
              store={store}
              onCopy={copySelectedNode}
              onDelete={deleteSelectedNode}
              onInsertNode={insertNode}
              onPaste={pasteNode}
              onPublish={publishCurrentMenu}
              onRedo={redoEditorChange}
              onSave={() => replaceCurrentMenu(menu, '菜单编辑已保存', false)}
              onSelectNode={setSelectedNodeId}
              onUndo={undoEditorChange}
              onUpdateCanvas={(patch) =>
                updateCurrentMenu(
                  (currentMenu) => ({ ...currentMenu, canvasConfig: { ...currentMenu.canvasConfig, ...patch } }),
                  '画布设置已更新',
                )
              }
              onUpdateNode={updateNode}
            />
          ) : null}

          {activeStep === 'publish' ? (
            <PublishPanel customerUrl={customerUrl} menu={menu} store={store} onPublish={publishQrCode} />
          ) : null}
        </section>

        {activeStep !== 'editor' ? (
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
        ) : null}
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

interface MenuEditorProps {
  canRedo: boolean;
  canUndo: boolean;
  menu: Menu;
  selectedNodeId: string | null;
  store: StoreModel;
  onCopy: () => void;
  onDelete: () => void;
  onInsertNode: (type: 'text' | 'image' | 'rect' | 'container' | 'storeInfo') => void;
  onPaste: () => void;
  onPublish: () => void;
  onRedo: () => void;
  onSave: () => void;
  onSelectNode: (nodeId: string | null) => void;
  onUndo: () => void;
  onUpdateCanvas: (patch: Partial<Menu['canvasConfig']>) => void;
  onUpdateNode: (nodeId: string, patch: NodePatch, message?: string, shouldTrackHistory?: boolean) => void;
}

function MenuEditor({
  canRedo,
  canUndo,
  menu,
  onCopy,
  onDelete,
  onInsertNode,
  onPaste,
  onPublish,
  onRedo,
  onSave,
  onSelectNode,
  onUndo,
  onUpdateCanvas,
  onUpdateNode,
  selectedNodeId,
  store,
}: MenuEditorProps) {
  const sortedNodes = [...menu.nodes].sort((left, right) => left.zIndex - right.zIndex);
  const selectedNode = menu.nodes.find((node) => node.id === selectedNodeId) ?? null;

  return (
    <section className="overflow-hidden rounded-lg border border-ink/10 bg-porcelain shadow-sm">
      <EditorToolbar
        canRedo={canRedo}
        canUndo={canUndo}
        menu={menu}
        selectedNode={selectedNode}
        onCopy={onCopy}
        onDelete={onDelete}
        onPaste={onPaste}
        onPublish={onPublish}
        onRedo={onRedo}
        onSave={onSave}
        onUndo={onUndo}
      />

      <div className="grid min-h-[720px] grid-cols-[220px_minmax(420px,1fr)_260px]">
        <EditorLeftPanel
          nodes={sortedNodes}
          selectedNodeId={selectedNodeId}
          onInsertNode={onInsertNode}
          onSelectNode={onSelectNode}
        />
        <EditorCanvas
          menu={menu}
          nodes={sortedNodes}
          selectedNodeId={selectedNodeId}
          store={store}
          onSelectNode={onSelectNode}
          onUpdateNode={onUpdateNode}
        />
        <EditorPropertiesPanel
          menu={menu}
          selectedNode={selectedNode}
          onUpdateCanvas={onUpdateCanvas}
          onUpdateNode={onUpdateNode}
        />
      </div>
    </section>
  );
}

interface EditorToolbarProps {
  canRedo: boolean;
  canUndo: boolean;
  menu: Menu;
  selectedNode: EditorNode | null;
  onCopy: () => void;
  onDelete: () => void;
  onPaste: () => void;
  onPublish: () => void;
  onRedo: () => void;
  onSave: () => void;
  onUndo: () => void;
}

function EditorToolbar({
  canRedo,
  canUndo,
  menu,
  onCopy,
  onDelete,
  onPaste,
  onPublish,
  onRedo,
  onSave,
  onUndo,
  selectedNode,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-ink/10 bg-ink px-4 py-3 text-porcelain">
      <div>
        <p className="text-sm font-semibold">菜单编辑器</p>
        <p className="text-xs text-porcelain/60">
          {menu.nodes.length} 个组件 · {selectedNode ? `已选择 ${selectedNode.name}` : '未选择组件'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ToolbarButton disabled={!canUndo} icon={<Undo2 className="h-4 w-4" />} label="撤销" onClick={onUndo} />
        <ToolbarButton disabled={!canRedo} icon={<Redo2 className="h-4 w-4" />} label="重做" onClick={onRedo} />
        <ToolbarButton disabled={!selectedNode} icon={<Copy className="h-4 w-4" />} label="复制" onClick={onCopy} />
        <ToolbarButton icon={<Copy className="h-4 w-4" />} label="粘贴" onClick={onPaste} />
        <ToolbarButton disabled={!selectedNode} icon={<Trash2 className="h-4 w-4" />} label="删除" onClick={onDelete} />
        <ToolbarButton icon={<Eye className="h-4 w-4" />} label="预览" onClick={onSave} />
        <ToolbarButton icon={<Save className="h-4 w-4" />} label="保存" onClick={onSave} />
        <button
          className="inline-flex items-center gap-2 rounded-md bg-citrus px-3 py-2 text-sm font-semibold text-ink hover:bg-citrus/90"
          type="button"
          onClick={onPublish}
        >
          <QrCode className="h-4 w-4" />
          发布
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  disabled = false,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md border border-porcelain/15 px-3 py-2 text-sm hover:bg-porcelain/10 disabled:cursor-not-allowed disabled:opacity-35"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

interface EditorLeftPanelProps {
  nodes: EditorNode[];
  selectedNodeId: string | null;
  onInsertNode: (type: 'text' | 'image' | 'rect' | 'container' | 'storeInfo') => void;
  onSelectNode: (nodeId: string | null) => void;
}

function EditorLeftPanel({ nodes, onInsertNode, onSelectNode, selectedNodeId }: EditorLeftPanelProps) {
  const componentButtons: Array<{
    type: 'text' | 'image' | 'rect' | 'container' | 'storeInfo';
    label: string;
    icon: ReactNode;
  }> = [
    { type: 'text', label: '文本', icon: <Type className="h-4 w-4" /> },
    { type: 'image', label: '图片', icon: <Image className="h-4 w-4" /> },
    { type: 'rect', label: '矩形', icon: <MousePointer2 className="h-4 w-4" /> },
    { type: 'container', label: '容器', icon: <Grid3X3 className="h-4 w-4" /> },
    { type: 'storeInfo', label: '店铺信息', icon: <Store className="h-4 w-4" /> },
  ];

  return (
    <aside className="border-r border-ink/10 bg-rice">
      <div className="border-b border-ink/10 p-4">
        <p className="text-sm font-semibold">组件面板</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {componentButtons.map((button) => (
            <button
              key={button.type}
              className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-porcelain px-3 py-2 text-sm hover:border-ink"
              type="button"
              onClick={() => onInsertNode(button.type)}
            >
              {button.icon}
              {button.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4" />
          图层
        </p>
        <div className="mt-3 space-y-2">
          {[...nodes].reverse().map((node) => (
            <button
              key={node.id}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                node.id === selectedNodeId ? 'border-ink bg-ink text-porcelain' : 'border-ink/10 bg-porcelain'
              }`}
              type="button"
              onClick={() => onSelectNode(node.id)}
            >
              <span className="block truncate font-medium">{node.name}</span>
              <span className={node.id === selectedNodeId ? 'text-xs text-porcelain/60' : 'text-xs text-ink/45'}>
                {node.type} · z{node.zIndex}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

interface EditorCanvasProps {
  menu: Menu;
  nodes: EditorNode[];
  selectedNodeId: string | null;
  store: StoreModel;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNode: (nodeId: string, patch: NodePatch, message?: string, shouldTrackHistory?: boolean) => void;
}

function EditorCanvas({ menu, nodes, onSelectNode, onUpdateNode, selectedNodeId, store }: EditorCanvasProps) {
  const [dragState, setDragState] = useState<{
    nodeId: string;
    startMouseX: number;
    startMouseY: number;
    startNodeX: number;
    startNodeY: number;
  } | null>(null);
  const zoom = menu.canvasConfig.zoom;
  const gridSize = menu.canvasConfig.gridSize;

  function snap(value: number): number {
    return menu.canvasConfig.snapToGrid ? Math.round(value / gridSize) * gridSize : Math.round(value);
  }

  function handleNodeMouseDown(event: MouseEvent<HTMLDivElement>, node: EditorNode): void {
    event.stopPropagation();
    onSelectNode(node.id);
    if (node.locked) {
      return;
    }
    setDragState({
      nodeId: node.id,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
    });
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>): void {
    if (!dragState) {
      return;
    }
    const nextX = snap(dragState.startNodeX + (event.clientX - dragState.startMouseX) / zoom);
    const nextY = snap(dragState.startNodeY + (event.clientY - dragState.startMouseY) / zoom);
    onUpdateNode(dragState.nodeId, { x: nextX, y: nextY }, '正在移动节点', false);
  }

  return (
    <div
      className="relative overflow-auto bg-[#d8d3c9] p-8"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragState(null)}
      onMouseLeave={() => setDragState(null)}
    >
      <div className="mb-3 flex items-center justify-between text-xs text-ink/55">
        <span>画布 {menu.canvasConfig.width} x {menu.canvasConfig.height}</span>
        <span>网格 {menu.canvasConfig.gridSize}px · 缩放 {Math.round(zoom * 100)}%</span>
      </div>
      <div
        className="relative mx-auto overflow-hidden border border-ink/20 shadow-xl"
        style={{
          width: menu.canvasConfig.width * zoom,
          height: menu.canvasConfig.height * zoom,
          backgroundColor: menu.canvasConfig.background,
        }}
        onMouseDown={() => onSelectNode(null)}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(23,23,23,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,23,23,.16) 1px, transparent 1px)',
            backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          }}
        />
        <div className="origin-top-left" style={{ transform: `scale(${zoom})`, width: menu.canvasConfig.width }}>
          {nodes
            .filter((node) => node.visible)
            .map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                selected={node.id === selectedNodeId}
                store={store}
                onMouseDown={(event) => handleNodeMouseDown(event, node)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function CanvasNode({
  node,
  onMouseDown,
  selected,
  store,
}: {
  node: EditorNode;
  selected: boolean;
  store: StoreModel;
  onMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
}) {
  const baseStyle = {
    left: node.x,
    top: node.y,
    width: node.width,
    height: node.height,
    transform: `rotate(${node.rotation}deg)`,
    zIndex: node.zIndex,
  };

  return (
    <div
      className={`absolute cursor-move overflow-hidden border ${
        selected ? 'border-leaf ring-2 ring-leaf/30' : 'border-transparent'
      }`}
      style={baseStyle}
      onMouseDown={onMouseDown}
    >
      <NodeContent node={node} store={store} />
    </div>
  );
}

function NodeContent({ node, store }: { node: EditorNode; store: StoreModel }) {
  if (node.type === 'text') {
    return (
      <div
        className="flex h-full w-full items-center px-2"
        style={{ color: node.color, fontSize: node.fontSize, fontWeight: node.fontWeight }}
      >
        {node.text}
      </div>
    );
  }

  if (node.type === 'image') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ink/10 text-xs text-ink/45">
        {node.src ? <img alt={node.alt} className="h-full w-full object-cover" src={node.src} /> : '图片占位'}
      </div>
    );
  }

  if (node.type === 'rect' || node.type === 'circle' || node.type === 'line') {
    return (
      <div
        className="h-full w-full"
        style={{
          background: node.fill,
          border: `${node.strokeWidth}px solid ${node.stroke}`,
          borderRadius: node.type === 'circle' ? '999px' : node.radius ?? 0,
        }}
      />
    );
  }

  if (node.type === 'container') {
    return (
      <div
        className="h-full w-full"
        style={{ background: node.background, border: `1px solid ${node.borderColor}`, borderRadius: node.borderRadius }}
      />
    );
  }

  if (node.type === 'storeInfo') {
    return (
      <div className="h-full w-full bg-ink p-4 text-porcelain">
        <p className="text-lg font-semibold">{store.name}</p>
        <div className="mt-2 flex gap-3 text-xs text-porcelain/75">
          <span>评分 {store.rating.toFixed(1)}</span>
          <span>{store.location}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-porcelain/60">{store.description}</p>
      </div>
    );
  }

  return <div className="h-full w-full bg-citrus/20" />;
}

interface EditorPropertiesPanelProps {
  menu: Menu;
  selectedNode: EditorNode | null;
  onUpdateCanvas: (patch: Partial<Menu['canvasConfig']>) => void;
  onUpdateNode: (nodeId: string, patch: NodePatch, message?: string, shouldTrackHistory?: boolean) => void;
}

function EditorPropertiesPanel({ menu, onUpdateCanvas, onUpdateNode, selectedNode }: EditorPropertiesPanelProps) {
  return (
    <aside className="border-l border-ink/10 bg-porcelain p-4">
      <p className="text-sm font-semibold">属性面板</p>

      <div className="mt-4 space-y-4">
        <section className="rounded-lg bg-rice p-3">
          <p className="mb-3 text-xs font-semibold text-ink/55">画布</p>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="缩放"
              max={1.6}
              min={0.5}
              step={0.1}
              value={menu.canvasConfig.zoom}
              onChange={(value) => onUpdateCanvas({ zoom: value })}
            />
            <NumberField
              label="网格"
              max={32}
              min={4}
              step={4}
              value={menu.canvasConfig.gridSize}
              onChange={(value) => onUpdateCanvas({ gridSize: value })}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-porcelain px-2 py-2 text-xs"
              type="button"
              onClick={() => onUpdateCanvas({ zoom: Math.max(0.5, menu.canvasConfig.zoom - 0.1) })}
            >
              <ZoomOut className="h-3.5 w-3.5" />
              缩小
            </button>
            <button
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-porcelain px-2 py-2 text-xs"
              type="button"
              onClick={() => onUpdateCanvas({ zoom: Math.min(1.6, menu.canvasConfig.zoom + 0.1) })}
            >
              <ZoomIn className="h-3.5 w-3.5" />
              放大
            </button>
          </div>
        </section>

        {selectedNode ? (
          <section className="space-y-3 rounded-lg bg-rice p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink/55">选中组件</p>
              {selectedNode.locked ? <span className="rounded bg-ink/10 px-2 py-1 text-xs text-ink/55">锁定</span> : null}
            </div>
            <TextField
              label="名称"
              value={selectedNode.name}
              onChange={(value) => onUpdateNode(selectedNode.id, { name: value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X" max={999} min={-999} step={1} value={selectedNode.x} onChange={(value) => onUpdateNode(selectedNode.id, { x: value })} />
              <NumberField label="Y" max={999} min={-999} step={1} value={selectedNode.y} onChange={(value) => onUpdateNode(selectedNode.id, { y: value })} />
              <NumberField label="宽" max={999} min={1} step={1} value={selectedNode.width} onChange={(value) => onUpdateNode(selectedNode.id, { width: value })} />
              <NumberField label="高" max={999} min={1} step={1} value={selectedNode.height} onChange={(value) => onUpdateNode(selectedNode.id, { height: value })} />
              <NumberField
                label="旋转"
                max={360}
                min={-360}
                step={1}
                value={selectedNode.rotation}
                onChange={(value) => onUpdateNode(selectedNode.id, { rotation: value })}
              />
              <NumberField label="层级" max={999} min={0} step={1} value={selectedNode.zIndex} onChange={(value) => onUpdateNode(selectedNode.id, { zIndex: value })} />
            </div>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-porcelain px-3 py-2 text-sm"
              type="button"
              onClick={() => onUpdateNode(selectedNode.id, { rotation: selectedNode.rotation + 15 })}
            >
              <RotateCw className="h-4 w-4" />
              旋转 15 度
            </button>
            {selectedNode.type === 'text' ? (
              <>
                <TextField
                  label="文本"
                  value={selectedNode.text}
                  onChange={(value) => onUpdateNode(selectedNode.id, { text: value })}
                />
                <NumberField
                  label="字号"
                  max={72}
                  min={8}
                  step={1}
                  value={selectedNode.fontSize}
                  onChange={(value) => onUpdateNode(selectedNode.id, { fontSize: value })}
                />
              </>
            ) : null}
            {selectedNode.type === 'image' ? (
              <>
                <TextField
                  label="图片地址"
                  value={selectedNode.src}
                  onChange={(value) => onUpdateNode(selectedNode.id, { src: value })}
                />
                <TextField
                  label="替代文本"
                  value={selectedNode.alt}
                  onChange={(value) => onUpdateNode(selectedNode.id, { alt: value })}
                />
              </>
            ) : null}
          </section>
        ) : (
          <div className="rounded-lg border border-dashed border-ink/20 p-4 text-sm leading-6 text-ink/55">
            请选择画布中的组件或图层。店铺简略信息组件默认保留，展示评分和地点，不允许删除。
          </div>
        )}
      </div>
    </aside>
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
