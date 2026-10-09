function decode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function parseStoreId(scanValue) {
  const value = decode(String(scanValue || '').trim())
  if (!value) {
    return ''
  }

  const match = value.match(/(?:^|[?&#])storeId=([^&#]+)/i)
  if (match) {
    return decode(match[1]).trim()
  }

  const sceneMatch = value.match(/(?:^|[?&#])scene=([^&#]+)/i)
  if (sceneMatch) {
    return parseStoreId(sceneMatch[1])
  }

  return /^[a-zA-Z0-9_-]+$/.test(value) ? value : ''
}
