export function formatMoney(cents = 0) {
  return `¥${(Number(cents) / 100).toFixed(2)}`
}

export function centsToYuanInput(cents = 0) {
  const value = Number(cents) / 100
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function parseYuanToCents(value) {
  const text = String(value ?? '').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null
  }

  const [yuan, fraction = ''] = text.split('.')
  const cents = Number(yuan) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}
