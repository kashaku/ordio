import type { Comment, Menu, MenuTemplate, OrdioData, Store } from '../types/domain';

const createdAt = '2026-10-08T12:00:00.000Z';

export const localUser = { id: 'local-user-001', nickname: '小禾' };

export const seedVersion = 2;

export const demoStore: Store = {
  id: 'demo-store-001',
  name: '禾间小馆',
  rating: 4.8,
  location: '上海市 静安寺商圈',
  address: '上海市静安区愚园路 88 号 1 层',
  phone: '021-8800-1024',
  businessHours: '10:30-21:30',
  cover: '',
  description: '主打轻食、热汤和现炒简餐，适合午餐和晚间小聚。',
  story: '我们把社区小馆做成一个每天都能安心吃饭的地方，菜单短一点，出品稳一点。',
  qrCodeUrl: '/m/demo-store-001',
  extraModules: [
    {
      id: 'module-story-001',
      type: 'story',
      title: '店铺故事',
      content: '从一碗番茄牛腩汤开始，禾间小馆希望把家常味道做得更稳定、更干净。',
      images: [],
      sortOrder: 1,
    },
    {
      id: 'module-product-001',
      type: 'product',
      title: '周边产品',
      content: '店内自制柠檬茶和冷萃包可随餐购买。',
      images: [],
      sortOrder: 2,
    },
  ],
};

export const classicDeliveryTemplate: MenuTemplate = {
  id: 'template-classic-delivery',
  name: '经典外卖点餐布局',
  description: '顶部店铺信息、左侧分类、右侧菜品、底部购物车，适合手机扫码点餐。',
  previewImage: '',
  canvasConfig: {
    width: 375,
    height: 812,
    background: '#FAF7F0',
    gridSize: 8,
    snapToGrid: true,
    zoom: 1,
  },
  nodes: [
    {
      id: 'node-store-info',
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
      binding: { kind: 'store', storeId: demoStore.id },
    },
    {
      id: 'node-category-sidebar',
      type: 'categorySidebar',
      name: '分类导航',
      x: 0,
      y: 132,
      width: 88,
      height: 612,
      rotation: 0,
      zIndex: 20,
      locked: false,
      visible: true,
      binding: { kind: 'category', categoryId: 'cat-signature' },
    },
    {
      id: 'node-dish-list',
      type: 'dishList',
      name: '菜品列表',
      x: 88,
      y: 132,
      width: 287,
      height: 612,
      rotation: 0,
      zIndex: 30,
      locked: false,
      visible: true,
      binding: { kind: 'category', categoryId: 'cat-signature' },
    },
    {
      id: 'node-cart-bar',
      type: 'cartBar',
      name: '底部购物车',
      x: 12,
      y: 744,
      width: 351,
      height: 56,
      rotation: 0,
      zIndex: 40,
      locked: false,
      visible: true,
      binding: { kind: 'cart' },
    },
  ],
};

export const demoMenu: Menu = {
  id: 'menu-demo-001',
  storeId: demoStore.id,
  templateId: classicDeliveryTemplate.id,
  status: 'published',
  canvasConfig: classicDeliveryTemplate.canvasConfig,
  nodes: classicDeliveryTemplate.nodes,
  categories: [
    { id: 'cat-signature', storeId: demoStore.id, name: '招牌推荐', sortOrder: 1 },
    { id: 'cat-rice', storeId: demoStore.id, name: '热饭套餐', sortOrder: 2 },
    { id: 'cat-drink', storeId: demoStore.id, name: '饮品小食', sortOrder: 3 },
  ],
  dishes: [
    {
      id: 'dish-beef-tomato',
      storeId: demoStore.id,
      categoryId: 'cat-signature',
      name: '番茄牛腩饭',
      price: 36,
      image: '',
      description: '慢炖牛腩配酸甜番茄汤汁，附时蔬和米饭。',
      tags: ['招牌', '热卖'],
      sales: 268,
      specs: [
        {
          id: 'spec-rice',
          name: '米饭',
          required: true,
          options: [
            { id: 'rice-normal', name: '正常饭量', priceDelta: 0 },
            { id: 'rice-extra', name: '加饭', priceDelta: 2 },
          ],
        },
      ],
    },
    {
      id: 'dish-chicken-bowl',
      storeId: demoStore.id,
      categoryId: 'cat-rice',
      name: '照烧鸡腿饭',
      price: 32,
      image: '',
      description: '去骨鸡腿煎至焦香，搭配照烧酱和清爽配菜。',
      tags: ['午餐优选'],
      sales: 192,
      specs: [],
    },
    {
      id: 'dish-lemon-tea',
      storeId: demoStore.id,
      categoryId: 'cat-drink',
      name: '手打柠檬茶',
      price: 15,
      image: '',
      description: '现切香水柠檬，茶感清爽，甜度可调。',
      tags: ['冰饮'],
      sales: 316,
      specs: [
        {
          id: 'spec-sugar',
          name: '甜度',
          required: true,
          options: [
            { id: 'sugar-less', name: '少糖', priceDelta: 0 },
            { id: 'sugar-normal', name: '正常糖', priceDelta: 0 },
          ],
        },
      ],
    },
    { id: 'dish-mushroom-beef', storeId: demoStore.id, categoryId: 'cat-signature', name: '黑椒菌菇牛肉饭', price: 39, image: '', description: '牛肉搭配口蘑与杏鲍菇，黑椒汁现炒，配时蔬与米饭。', tags: ['现炒', '人气'], sales: 214, specs: [] },
    { id: 'dish-salmon-rice', storeId: demoStore.id, categoryId: 'cat-signature', name: '香煎三文鱼饭', price: 48, image: '', description: '三文鱼煎至表皮微脆，搭配柠檬、玉米与青菜。', tags: ['精选'], sales: 126, specs: [] },
    { id: 'dish-braised-pork', storeId: demoStore.id, categoryId: 'cat-rice', name: '家常红烧肉饭', price: 35, image: '', description: '红烧肉慢炖入味，配卤蛋与小青菜，酱汁单独装。', tags: ['家常味'], sales: 238, specs: [] },
    { id: 'dish-tofu-rice', storeId: demoStore.id, categoryId: 'cat-rice', name: '麻婆豆腐饭', price: 26, image: '', description: '嫩豆腐搭配肉末与豆瓣酱，附清炒青菜和米饭。', tags: ['微辣'], sales: 187, specs: [{ id: 'spec-tofu-spice', name: '辣度', required: true, options: [{ id: 'tofu-mild', name: '微辣', priceDelta: 0 }, { id: 'tofu-medium', name: '中辣', priceDelta: 0 }] }] },
    { id: 'dish-pumpkin-soup', storeId: demoStore.id, categoryId: 'cat-drink', name: '奶香南瓜浓汤', price: 18, image: '', description: '南瓜慢煮打成细腻浓汤，搭配烤面包丁。', tags: ['热汤'], sales: 142, specs: [] },
    { id: 'dish-potato-wedges', storeId: demoStore.id, categoryId: 'cat-drink', name: '香草烤薯角', price: 16, image: '', description: '带皮土豆撒上迷迭香烤制，附番茄蘸酱。', tags: ['小食'], sales: 175, specs: [] },
    { id: 'dish-plum-juice', storeId: demoStore.id, categoryId: 'cat-drink', name: '桂花酸梅汤', price: 12, image: '', description: '乌梅与山楂熬制，桂花点缀，清爽解腻。', tags: ['自制饮品'], sales: 289, specs: [{ id: 'spec-plum-temperature', name: '温度', required: true, options: [{ id: 'plum-cold', name: '冰饮', priceDelta: 0 }, { id: 'plum-normal', name: '常温', priceDelta: 0 }] }] },
  ],
  createdAt,
  updatedAt: createdAt,
};

export const noodleStore: Store = {
  id: 'store-noodle-002', name: '青柚面馆', rating: 4.7,
  location: '杭州市 滨江星光大道', address: '杭州市滨江区江南大道 228 号', phone: '0571-8800-2024', businessHours: '09:00-22:00', cover: '',
  description: '每天熬制鲜汤，现煮面条，搭配江南风味小食。',
  story: '一碗热面，几样小菜。我们坚持每天熬汤，让附近的客人吃得舒服。', qrCodeUrl: '/m/store-noodle-002',
  extraModules: [
    { id: 'noodle-story', type: 'story', title: '一碗面的日常', content: '清晨熬汤，午间煮面，汤底与浇头分开准备，点单后现煮。', images: [], sortOrder: 1 },
    { id: 'noodle-brand', type: 'brand', title: '我们的食材', content: '选用筋道面条、时令蔬菜，保持汤底清爽与浇头本味。', images: [], sortOrder: 2 },
  ],
};

export const noodleMenu: Menu = {
  id: 'menu-noodle-002', storeId: noodleStore.id, templateId: classicDeliveryTemplate.id, status: 'published',
  canvasConfig: { ...classicDeliveryTemplate.canvasConfig },
  nodes: classicDeliveryTemplate.nodes.map((node) => ({ ...node, id: `noodle-${node.id}`, ...('binding' in node ? { binding: node.binding.kind === 'store' ? { kind: 'store' as const, storeId: noodleStore.id } : node.binding.kind === 'category' ? { kind: 'category' as const, categoryId: 'noodle-signature' } : node.binding } : {}) })),
  categories: [
    { id: 'noodle-signature', storeId: noodleStore.id, name: '招牌汤面', sortOrder: 1 },
    { id: 'noodle-mixed', storeId: noodleStore.id, name: '拌面精选', sortOrder: 2 },
    { id: 'noodle-sides', storeId: noodleStore.id, name: '小食饮品', sortOrder: 3 },
  ],
  dishes: [
    { id: 'noodle-beef-soup', storeId: noodleStore.id, categoryId: 'noodle-signature', name: '清汤牛肉面', price: 32, image: '', description: '清炖牛肉汤底，配牛肉片、小青菜与葱花。', tags: ['招牌'], sales: 365, specs: [{ id: 'noodle-size', name: '份量', required: true, options: [{ id: 'noodle-regular', name: '标准份', priceDelta: 0 }, { id: 'noodle-large', name: '大份', priceDelta: 5 }] }] },
    { id: 'noodle-tomato-egg', storeId: noodleStore.id, categoryId: 'noodle-signature', name: '番茄鸡蛋面', price: 22, image: '', description: '新鲜番茄熬成酸甜汤底，搭配炒鸡蛋与青菜。', tags: ['家常'], sales: 298, specs: [] },
    { id: 'noodle-pork-mushroom', storeId: noodleStore.id, categoryId: 'noodle-signature', name: '香菇肉丝面', price: 26, image: '', description: '香菇和肉丝现炒成浇头，鲜汤配细面。', tags: ['鲜香'], sales: 216, specs: [] },
    { id: 'noodle-pickled-fish', storeId: noodleStore.id, categoryId: 'noodle-signature', name: '酸菜鱼片面', price: 35, image: '', description: '鱼片配爽口酸菜，汤底微酸微辣，附青菜。', tags: ['微辣'], sales: 183, specs: [] },
    { id: 'noodle-scallion', storeId: noodleStore.id, categoryId: 'noodle-mixed', name: '葱油拌面', price: 19, image: '', description: '慢熬葱油拌细面，配酥香葱段和小菜。', tags: ['经典'], sales: 421, specs: [{ id: 'noodle-extra', name: '加料', required: false, options: [{ id: 'noodle-extra-egg', name: '加卤蛋', priceDelta: 3 }, { id: 'noodle-extra-beef', name: '加牛肉', priceDelta: 8 }] }] },
    { id: 'noodle-sesame-chicken', storeId: noodleStore.id, categoryId: 'noodle-mixed', name: '芝麻鸡丝拌面', price: 28, image: '', description: '鸡丝与黄瓜丝搭配芝麻酱，拌面清爽顺口。', tags: ['人气'], sales: 254, specs: [] },
    { id: 'noodle-mushroom-mixed', storeId: noodleStore.id, categoryId: 'noodle-mixed', name: '菌菇素拌面', price: 25, image: '', description: '三种菌菇现炒，搭配时蔬与酱汁拌面。', tags: ['素食'], sales: 147, specs: [] },
    { id: 'noodle-dumplings', storeId: noodleStore.id, categoryId: 'noodle-sides', name: '鲜肉煎饺', price: 18, image: '', description: '六只鲜肉煎饺，底部酥脆，附香醋蘸汁。', tags: ['小食'], sales: 308, specs: [] },
    { id: 'noodle-cucumber', storeId: noodleStore.id, categoryId: 'noodle-sides', name: '爽口拍黄瓜', price: 12, image: '', description: '黄瓜现拍，蒜香调汁，可选择不放蒜。', tags: ['凉菜'], sales: 232, specs: [{ id: 'noodle-garlic', name: '口味', required: true, options: [{ id: 'garlic-normal', name: '蒜香', priceDelta: 0 }, { id: 'garlic-none', name: '不放蒜', priceDelta: 0 }] }] },
    { id: 'noodle-osmanthus-tea', storeId: noodleStore.id, categoryId: 'noodle-sides', name: '桂花乌龙茶', price: 14, image: '', description: '桂花香搭配乌龙茶，口感清爽，甜度可选。', tags: ['茶饮'], sales: 196, specs: [{ id: 'noodle-tea-sugar', name: '甜度', required: true, options: [{ id: 'noodle-tea-less', name: '少糖', priceDelta: 0 }, { id: 'noodle-tea-none', name: '无糖', priceDelta: 0 }] }] },
  ],
  createdAt, updatedAt: createdAt,
};

const commentTexts: Record<string, [string, string]> = {
  'dish-beef-tomato': ['牛腩炖得很软，番茄汤汁拌饭特别香。', '份量合适，配菜清爽，下次还会点。'],
  'dish-chicken-bowl': ['鸡腿外皮焦香，照烧汁甜咸刚好。', '鸡肉嫩，米饭也不干，午餐很方便。'],
  'dish-lemon-tea': ['柠檬香气足，少糖刚好。', '搭配热饭很解腻，茶味也够。'],
  'dish-mushroom-beef': ['菌菇和牛肉很搭，黑椒味道够香。', '出餐快，肉片和配菜都不少。'],
  'dish-salmon-rice': ['鱼肉煎得嫩，搭配柠檬很清爽。', '配菜种类丰富，鱼皮也香。'],
  'dish-braised-pork': ['红烧肉很入味，卤蛋也好吃。', '酱汁单独装很方便，拌饭刚好。'],
  'dish-tofu-rice': ['微辣很合适，豆腐嫩，汤汁下饭。', '味道不错，青菜搭配起来不腻。'],
  'dish-pumpkin-soup': ['南瓜香味自然，浓汤细腻顺滑。', '面包丁脆脆的，趁热喝很好。'],
  'dish-potato-wedges': ['薯角外香里软，香草味很喜欢。', '搭配番茄酱不错，份量也够。'],
  'dish-plum-juice': ['酸甜平衡，桂花香很舒服。', '配红烧肉很解腻，常温也好喝。'],
  'noodle-beef-soup': ['汤很清爽，牛肉香，面条筋道。', '大份很满足，青菜也新鲜。'],
  'noodle-tomato-egg': ['番茄汤底酸甜，鸡蛋给得挺多。', '家常味道，热乎乎的一碗很舒服。'],
  'noodle-pork-mushroom': ['香菇味很浓，肉丝鲜嫩。', '浇头和面条很搭，汤也不错。'],
  'noodle-pickled-fish': ['鱼片嫩，酸菜爽口，辣度刚好。', '汤底开胃，面条吸汤后特别香。'],
  'noodle-scallion': ['葱油香气很足，面条拌得均匀。', '加了卤蛋，简单但很好吃。'],
  'noodle-sesame-chicken': ['芝麻酱浓香，黄瓜丝很清爽。', '鸡丝不少，拌起来口感很好。'],
  'noodle-mushroom-mixed': ['菌菇鲜香，蔬菜搭配丰富。', '酱汁不重，能吃出菌菇本味。'],
  'noodle-dumplings': ['饺子底部很脆，肉馅鲜。', '蘸香醋不错，配汤面刚好。'],
  'noodle-cucumber': ['黄瓜很脆，蒜香调汁很开胃。', '选择了不放蒜，味道也清爽。'],
  'noodle-osmanthus-tea': ['桂花香清淡，乌龙茶味舒服。', '无糖很清爽，吃完面来一杯刚好。'],
};

export const demoComments: Comment[] = [demoMenu, noodleMenu].flatMap((menu) => menu.dishes.flatMap((dish) =>
  commentTexts[dish.id].map((content, index): Comment => ({
    id: dish.id === 'dish-lemon-tea' && index === 0 ? 'comment-dish-001' : `comment-${dish.id}-${index + 1}`,
    storeId: menu.storeId, dishId: dish.id, commentedDishId: dish.id, orderId: null,
    userNickname: localUser.nickname, avatar: '', rating: index === 0 ? 5 : 4, content, images: [], selectedDishIds: [],
    dishNames: { [dish.id]: dish.name }, createdAt: index === 0 ? '2026-10-09T03:30:00.000Z' : createdAt,
  })),
));

export const seedData: OrdioData = {
  seedVersion,
  stores: [demoStore, noodleStore],
  menus: [demoMenu, noodleMenu],
  templates: [classicDeliveryTemplate],
  orders: [],
  comments: demoComments,
};
