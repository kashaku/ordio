export type ID = string;
export type ISODateTime = string;
export type MenuStatus = 'draft' | 'published';
export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export type StoreExtraModuleType = 'story' | 'product' | 'brand' | 'imageText';
export type EditorNodeType =
  | 'text'
  | 'image'
  | 'rect'
  | 'circle'
  | 'line'
  | 'container'
  | 'categorySidebar'
  | 'dishList'
  | 'dishCard'
  | 'cartBar'
  | 'storeInfo';

export interface Store {
  id: ID;
  name: string;
  rating: number;
  location: string;
  address: string;
  phone: string;
  businessHours: string;
  cover: string;
  description: string;
  story: string;
  extraModules: StoreExtraModule[];
  qrCodeUrl: string;
}

export interface StoreExtraModule {
  id: ID;
  type: StoreExtraModuleType;
  title: string;
  content: string;
  images: string[];
  sortOrder: number;
}

export interface Menu {
  id: ID;
  storeId: ID;
  templateId: ID | null;
  status: MenuStatus;
  canvasConfig: CanvasConfig;
  nodes: EditorNode[];
  categories: DishCategory[];
  dishes: Dish[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CanvasConfig {
  width: number;
  height: number;
  background: string;
  gridSize: number;
  snapToGrid: boolean;
  zoom: number;
}

export interface EditorNodeBase {
  id: ID;
  type: EditorNodeType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
}

export interface TextNode extends EditorNodeBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  color: string;
}

export interface ImageNode extends EditorNodeBase {
  type: 'image';
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain';
}

export interface ShapeNode extends EditorNodeBase {
  type: 'rect' | 'circle' | 'line';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius?: number;
}

export interface ContainerNode extends EditorNodeBase {
  type: 'container';
  background: string;
  borderColor: string;
  borderRadius: number;
  childNodeIds: ID[];
}

export interface TemplateComponentNode extends EditorNodeBase {
  type: 'categorySidebar' | 'dishList' | 'dishCard' | 'cartBar' | 'storeInfo';
  binding:
    | { kind: 'store'; storeId: ID }
    | { kind: 'category'; categoryId: ID }
    | { kind: 'dish'; dishId: ID }
    | { kind: 'cart' };
}

export type EditorNode = TextNode | ImageNode | ShapeNode | ContainerNode | TemplateComponentNode;

export interface DishCategory {
  id: ID;
  storeId: ID;
  name: string;
  sortOrder: number;
}

export interface Dish {
  id: ID;
  storeId: ID;
  categoryId: ID;
  name: string;
  price: number;
  image: string;
  description: string;
  tags: string[];
  sales: number;
  specs: DishSpecGroup[];
}

export interface DishSpecGroup {
  id: ID;
  name: string;
  options: DishSpecOption[];
  required: boolean;
}

export interface DishSpecOption {
  id: ID;
  name: string;
  priceDelta: number;
}

export interface CartItem {
  dishId: ID;
  quantity: number;
  specs: SelectedSpec[];
}

export interface SelectedSpec {
  groupId: ID;
  optionId: ID;
}

export interface Order {
  id: ID;
  storeId: ID;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: ISODateTime;
  itemDetails?: OrderItemDetail[];
}

export interface OrderItemDetail {
  dishId: ID;
  name: string;
  image: string;
  quantity: number;
  specNames: string[];
  unitPrice: number;
}

export interface Comment {
  id: ID;
  storeId: ID;
  dishId: ID | null;
  orderId: ID | null;
  userNickname: string;
  avatar: string;
  rating: number;
  content: string;
  images: string[];
  selectedDishIds: ID[];
  commentedDishId: ID | null;
  dishNames?: Record<ID, string>;
  createdAt: ISODateTime;
}

export interface MenuTemplate {
  id: ID;
  name: string;
  description: string;
  previewImage: string;
  canvasConfig: CanvasConfig;
  nodes: EditorNode[];
}

export interface OrdioData {
  stores: Store[];
  menus: Menu[];
  templates: MenuTemplate[];
  orders: Order[];
  comments: Comment[];
}
