function decode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function readParam(value, names) {
  const pattern = new RegExp(`(?:^|[?&#])(?:${names.join('|')})=([^&#]+)`, 'i')
  const match = value.match(pattern)
  return match ? decode(match[1]).trim() : ''
}

export function parseEntryPayload(scanValue) {
  const value = decode(String(scanValue || '').trim())
  if (!value) {
    return null
  }

  const scene = readParam(value, ['scene'])
  if (scene && scene !== value) {
    return parseEntryPayload(scene)
  }

  const tableToken = readParam(value, ['tableToken', 't'])
  if (/^tbl_[a-zA-Z0-9_-]{16,64}$/.test(tableToken)) {
    return { type: 'table', tableToken }
  }
  if (/^tbl_[a-zA-Z0-9_-]{16,64}$/.test(value)) {
    return { type: 'table', tableToken: value }
  }

  const storeId = readParam(value, ['storeId'])
  if (storeId) {
    return { type: 'store', storeId, legacy: true }
  }
  if (/^[a-zA-Z0-9_-]+$/.test(value)) {
    return { type: 'store', storeId: value, legacy: true }
  }

  return null
}

export function entryPayloadFromOptions(options = {}) {
  if (options.scene) {
    return options.scene
  }
  if (options.tableToken) {
    return `tableToken=${options.tableToken}`
  }
  if (options.storeId) {
    return `storeId=${options.storeId}`
  }
  return ''
}

export function buildTableScene(tableToken) {
  return `t=${tableToken}`
}
