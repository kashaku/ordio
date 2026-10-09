const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

exports.main = async (event = {}) => {
  const requestId = normalizeRequestId(event.requestId)
  try {
    const wxContext = cloud.getWXContext()
    const handler = actions[event.action]
    if (!handler) {
      throw new ApiError('ACTION_NOT_FOUND', '不支持的操作')
    }
    const data = await handler(event.payload || {}, wxContext)
    return { ok: true, data, requestId }
  } catch (error) {
    console.error('ordioApi failed', {
      requestId,
      action: event.action,
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
    })
    return {
      ok: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.code ? error.message : '服务暂时不可用',
      },
      requestId,
    }
  }
}

const actions = {
  'session.get': getSession,
  'entry.resolveTable': resolveTable,
  'merchant.listTables': listMerchantTables,
}

async function getSession(payload, wxContext) {
  if (!wxContext.OPENID) {
    throw new ApiError('WECHAT_IDENTITY_MISSING', '无法读取微信身份')
  }

  const user = await findOrCreateUser(wxContext.OPENID)

  const memberships = await db.collection('store_members')
    .where({ user_id: user._id, status: 'active' })
    .limit(100)
    .get()

  return {
    userId: user._id,
    memberships: memberships.data.map((item) => ({
      storeId: item.store_id,
      role: item.role,
    })),
  }
}

async function resolveTable(payload) {
  const tableToken = String(payload.tableToken || '').trim()
  if (!/^tbl_[a-zA-Z0-9_-]{16,64}$/.test(tableToken)) {
    throw new ApiError('INVALID_TABLE_TOKEN', '桌码格式无效')
  }

  const tableResult = await db.collection('tables')
    .where({ table_token: tableToken })
    .limit(1)
    .get()
  const table = tableResult.data[0]
  if (!table) {
    throw new ApiError('TABLE_NOT_FOUND', '桌码无效或已经更新')
  }
  if (!table.enabled) {
    throw new ApiError('TABLE_DISABLED', '当前桌台暂不可用，请联系店员')
  }

  const storeResult = await db.collection('stores')
    .where({ _id: table.store_id })
    .limit(1)
    .get()
  const store = storeResult.data[0]
  if (!store || store.status !== 'active') {
    throw new ApiError('STORE_UNAVAILABLE', '当前门店暂不可用')
  }

  return {
    type: 'table',
    storeId: store._id,
    tableId: table._id,
    tableName: table.name,
    tableArea: table.area || '',
    tableToken,
  }
}

async function listMerchantTables(payload, wxContext) {
  const storeId = String(payload.storeId || '').trim()
  if (!storeId) {
    throw new ApiError('STORE_REQUIRED', '缺少门店信息')
  }

  await requireStoreRole(storeId, wxContext, ['owner', 'manager'])
  const result = await db.collection('tables')
    .where({ store_id: storeId })
    .limit(100)
    .get()

  return result.data.map((table) => ({
    id: table._id,
    storeId: table.store_id,
    name: table.name,
    area: table.area || '',
    enabled: Boolean(table.enabled),
    qrFileId: table.qr_file_id || '',
  }))
}

async function findOrCreateUser(openid) {
  const users = db.collection('users')
  const existing = await users.where({ openid }).limit(1).get()
  let user = existing.data[0]
  if (!user) {
    try {
      const result = await users.add({
        data: {
          openid,
          status: 'active',
          created_at: db.serverDate(),
          updated_at: db.serverDate(),
        },
      })
      user = { _id: result._id, status: 'active' }
    } catch (error) {
      const retry = await users.where({ openid }).limit(1).get()
      user = retry.data[0]
      if (!user) {
        throw error
      }
    }
  }
  if (user.status !== 'active') {
    throw new ApiError('USER_DISABLED', '当前账号不可用')
  }
  return user
}

async function requireStoreRole(storeId, wxContext, allowedRoles) {
  if (!wxContext.OPENID) {
    throw new ApiError('WECHAT_IDENTITY_MISSING', '无法读取微信身份')
  }
  const users = await db.collection('users')
    .where({ openid: wxContext.OPENID, status: 'active' })
    .limit(1)
    .get()
  const user = users.data[0]
  if (!user) {
    throw new ApiError('UNAUTHORIZED', '当前账号没有门店权限')
  }

  const memberships = await db.collection('store_members')
    .where({ store_id: storeId, user_id: user._id, status: 'active' })
    .limit(1)
    .get()
  const membership = memberships.data[0]
  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new ApiError('FORBIDDEN', '当前账号没有执行该操作的权限')
  }
  return membership
}

function normalizeRequestId(value) {
  const requestId = String(value || '').trim()
  return /^[a-zA-Z0-9_-]{8,80}$/.test(requestId)
    ? requestId
    : `server_${Date.now().toString(36)}`
}
