import { getStore, resolveTableToken } from './repository'
import { parseEntryPayload } from '../utils/scan'

function entryError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

export async function resolveCustomerEntry(rawValue) {
  const payload = parseEntryPayload(rawValue)
  if (!payload) {
    throw entryError('INVALID_ENTRY', '没有识别到有效桌码')
  }

  if (payload.type === 'table') {
    const result = await resolveTableToken(payload.tableToken)
    if (!result) {
      throw entryError('TABLE_NOT_FOUND', '桌码无效或已经更新')
    }
    if (!result.table.enabled) {
      throw entryError('TABLE_DISABLED', '当前桌台暂不可用，请联系店员')
    }
    return {
      type: 'table',
      storeId: result.store.id,
      tableId: result.table.id,
      tableName: result.table.name,
      tableToken: result.table.token,
    }
  }

  const store = await getStore(payload.storeId)
  if (!store) {
    throw entryError('STORE_NOT_FOUND', '没有找到对应门店')
  }
  return {
    type: 'store',
    storeId: store.id,
    tableId: '',
    tableName: '',
    tableToken: '',
    legacy: true,
  }
}

export function buildStorefrontUrl(entry) {
  const params = [`storeId=${encodeURIComponent(entry.storeId)}`]
  if (entry.tableToken) {
    params.push(`tableToken=${encodeURIComponent(entry.tableToken)}`)
  }
  return `/pages/customer/storefront?${params.join('&')}`
}
