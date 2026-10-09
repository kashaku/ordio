export function createId(prefix = 'id') {
  const time = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${time}-${random}`
}

export function normalizeSelectedSpecs(selectedSpecs = []) {
  return selectedSpecs
    .map((item) => ({
      groupId: item.groupId,
      optionId: item.optionId,
    }))
    .sort((a, b) => a.groupId.localeCompare(b.groupId))
}

export function buildCartKey(dishId, selectedSpecs = []) {
  const specKey = normalizeSelectedSpecs(selectedSpecs)
    .map((item) => `${item.groupId}:${item.optionId}`)
    .join('|')

  return specKey ? `${dishId}::${specKey}` : dishId
}
