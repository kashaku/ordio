import { getStore, resolveTableToken } from './repository'
import { isCloudConfigured } from './cloud-client'
import { resolveCloudTable } from './session-service'
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
    if (isCloudConfigured()) {
      return resolveCloudTable(payload.tableToken)
    }

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
      tableArea: result.table.area || '',
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

export async function resolveCustomerTable(storeId, tableToken) {
  if (!tableToken) {
    return null
  }
  const entry = await resolveCustomerEntry(tableToken)
  if (entry.type !== 'table' || entry.storeId !== storeId) {
    throw entryError('TABLE_INVALID', '桌码与当前门店不匹配，请重新扫码')
  }
  return { id: entry.tableId, name: entry.tableName, area: entry.tableArea || '' }
}

export function buildCustomerUrl(page, params) {
  const query = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  return `/pages/customer/${page}?${query}`
}

export function buildStorefrontUrl(entry) {
  return buildCustomerUrl('storefront', { storeId: entry.storeId, tableToken: entry.tableToken })
}
