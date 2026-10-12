const templateIds = new Set(['warm', 'fresh', 'bold'])
const blockTypes = new Set(['notice', 'featured', 'story', 'storeInfo'])

function normalizeStorefrontConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError('主页配置格式无效')
  }

  const templateId = readEnum(value.templateId, templateIds, '主页模板无效')
  const accentColor = readColor(value.accentColor)
  const hero = normalizeHero(value.hero)
  const blocks = normalizeBlocks(value.blocks)
  const featuredDishIds = normalizeFeaturedDishIds(value.featuredDishIds)

  return { templateId, accentColor, hero, blocks, featuredDishIds }
}

function normalizeHero(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError('首屏配置无效')
  }
  return {
    eyebrow: readText(value.eyebrow, 20, '首屏短标'),
    title: readText(value.title, 32, '主页标题', true),
    subtitle: readText(value.subtitle, 80, '主页副标题'),
    buttonText: readText(value.buttonText, 12, '按钮文案', true),
  }
}

function normalizeBlocks(value) {
  if (value == null) {
    return []
  }
  if (!Array.isArray(value) || value.length > 12) {
    throw validationError('主页区块数量无效')
  }

  const ids = new Set()
  return value.map((block) => {
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      throw validationError('主页区块格式无效')
    }
    const id = String(block.id || '').trim()
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || ids.has(id)) {
      throw validationError('主页区块标识无效或重复')
    }
    ids.add(id)
    return {
      id,
      type: readEnum(block.type, blockTypes, '主页区块类型无效'),
      visible: block.visible !== false,
      title: readText(block.title, 30, '区块标题'),
      content: readText(block.content, 500, '区块内容'),
    }
  })
}

function normalizeFeaturedDishIds(value) {
  if (value == null) {
    return []
  }
  if (!Array.isArray(value) || value.length > 4) {
    throw validationError('招牌菜最多选择 4 个')
  }
  const ids = value.map((item) => String(item || '').trim())
  if (ids.some((id) => !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) || new Set(ids).size !== ids.length) {
    throw validationError('招牌菜配置无效')
  }
  return ids
}

function readColor(value) {
  const color = String(value || '').trim().toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(color)) {
    throw validationError('品牌色格式无效')
  }
  return color
}

function readEnum(value, allowed, message) {
  const result = String(value || '').trim()
  if (!allowed.has(result)) {
    throw validationError(message)
  }
  return result
}

function readText(value, maxLength, label, required = false) {
  const result = String(value || '').trim()
  if ((required && !result) || result.length > maxLength) {
    throw validationError(`${label}长度无效`)
  }
  return result
}

function validationError(message) {
  const error = new Error(message)
  error.code = 'INVALID_STOREFRONT_CONFIG'
  return error
}

module.exports = { normalizeStorefrontConfig }
