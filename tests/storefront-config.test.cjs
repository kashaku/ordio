const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizeStorefrontConfig } = require('../src/cloudfunctions/ordioApi/storefront-config')

function validConfig() {
  return {
    templateId: 'fresh',
    accentColor: '#2F7D57',
    hero: {
      eyebrow: '今日好味',
      title: '认真做一顿热乎饭',
      subtitle: '现点现做，欢迎入座。',
      buttonText: '开始点餐',
    },
    blocks: [
      { id: 'notice', type: 'notice', visible: true, title: '门店公告', content: '欢迎光临' },
    ],
    featuredDishIds: ['dish-1', 'dish-2'],
    ignored: '不会进入快照',
  }
}

test('normalizes a valid storefront config', () => {
  const result = normalizeStorefrontConfig(validConfig())
  assert.equal(result.accentColor, '#2f7d57')
  assert.equal(result.ignored, undefined)
  assert.deepEqual(result.featuredDishIds, ['dish-1', 'dish-2'])
})

test('rejects unknown templates', () => {
  const config = validConfig()
  config.templateId = 'custom-html'
  assert.throws(() => normalizeStorefrontConfig(config), { code: 'INVALID_STOREFRONT_CONFIG' })
})

test('rejects duplicate block ids', () => {
  const config = validConfig()
  config.blocks.push({ ...config.blocks[0] })
  assert.throws(() => normalizeStorefrontConfig(config), /区块标识/)
})

test('limits featured dishes to four', () => {
  const config = validConfig()
  config.featuredDishIds = ['dish-1', 'dish-2', 'dish-3', 'dish-4', 'dish-5']
  assert.throws(() => normalizeStorefrontConfig(config), /最多选择 4 个/)
})
