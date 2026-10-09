export const storefrontTemplates = [
  {
    id: 'warm',
    name: '暖意食堂',
    description: '适合家常菜、简餐和社区餐厅',
    defaultAccent: '#B85C38',
  },
  {
    id: 'fresh',
    name: '清新自然',
    description: '适合轻食、茶饮和健康餐',
    defaultAccent: '#2F7D57',
  },
  {
    id: 'bold',
    name: '醒目招牌',
    description: '适合快餐、小吃和夜宵门店',
    defaultAccent: '#E08A16',
  },
]

export const storefrontAccentColors = [
  '#B85C38',
  '#2F7D57',
  '#E08A16',
  '#8D6A22',
  '#3C5A7D',
  '#7A4B78',
]

export function createDefaultStorefront(storeId, dishIds = []) {
  const now = new Date().toISOString()
  return {
    id: `storefront-${storeId}`,
    storeId,
    status: 'draft',
    templateId: 'warm',
    accentColor: '#B85C38',
    hero: {
      eyebrow: '今日好味',
      title: '认真做一顿热乎饭',
      subtitle: '现点现做，欢迎入座。',
      buttonText: '开始点餐',
    },
    featuredDishIds: dishIds.slice(0, 3),
    blocks: [
      {
        id: 'block-notice',
        type: 'notice',
        visible: true,
        title: '门店公告',
        content: '高峰时段请耐心等候，感谢理解。',
      },
      {
        id: 'block-featured',
        type: 'featured',
        visible: true,
        title: '本店招牌',
        content: '',
      },
      {
        id: 'block-story',
        type: 'story',
        visible: true,
        title: '关于我们',
        content: '用当季食材和熟悉的味道，认真做好每一餐。',
      },
      {
        id: 'block-store-info',
        type: 'storeInfo',
        visible: true,
        title: '到店信息',
        content: '',
      },
    ],
    updatedAt: now,
    publishedAt: null,
  }
}
