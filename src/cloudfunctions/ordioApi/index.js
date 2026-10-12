const cloud = require('wx-server-sdk')
const { normalizeStorefrontConfig } = require('./storefront-config')

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
  'storefront.getDraft': getStorefrontDraft,
  'storefront.saveDraft': saveStorefrontDraft,
  'storefront.publish': publishStorefront,
  'storefront.getPublished': getPublishedStorefront,
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

async function getStorefrontDraft(payload, wxContext) {
  const storeId = readStoreId(payload)
  await requireStoreRole(storeId, wxContext, ['owner', 'manager'])

  const result = await db.collection('storefront_drafts')
    .where({ store_id: storeId })
    .limit(1)
    .get()
  const draft = result.data[0]

  return draft ? formatDraft(draft) : null
}

async function saveStorefrontDraft(payload, wxContext) {
  const storeId = readStoreId(payload)
  const membership = await requireStoreRole(storeId, wxContext, ['owner', 'manager'])
  await requireEditableStore(storeId)

  const config = normalizeStorefrontConfig(payload.config)
  const drafts = db.collection('storefront_drafts')
  const draftId = `storefront-draft-${storeId}`
  const result = await drafts.where({ store_id: storeId }).limit(1).get()
  const current = result.data[0]
  const expectedRevision = Number(payload.revision || 0)
  const currentRevision = Number(current?.revision || 0)

  if (expectedRevision !== currentRevision) {
    throw new ApiError('DRAFT_CONFLICT', '主页草稿已被其他设备更新，请刷新后重试')
  }

  const nextRevision = currentRevision + 1
  const data = {
    store_id: storeId,
    config,
    revision: nextRevision,
    published_version: Number(current?.published_version || 0),
    updated_by: membership.user_id,
    updated_at: db.serverDate(),
  }

  if (current) {
    await drafts.doc(current._id).update({ data })
  } else {
    await drafts.doc(draftId).set({
      data: {
        ...data,
        created_by: membership.user_id,
        created_at: db.serverDate(),
      },
    })
  }

  return {
    storeId,
    config,
    revision: nextRevision,
    publishedVersion: Number(current?.published_version || 0),
  }
}

async function publishStorefront(payload, wxContext) {
  const storeId = readStoreId(payload)
  const membership = await requireStoreRole(storeId, wxContext, ['owner', 'manager'])
  await requireEditableStore(storeId)

  const drafts = db.collection('storefront_drafts')
  const draftResult = await drafts.where({ store_id: storeId }).limit(1).get()
  const draft = draftResult.data[0]
  if (!draft) {
    throw new ApiError('DRAFT_NOT_FOUND', '请先保存主页草稿')
  }

  const expectedRevision = Number(payload.revision || 0)
  if (expectedRevision !== Number(draft.revision || 0)) {
    throw new ApiError('DRAFT_CONFLICT', '主页草稿已被其他设备更新，请刷新后重试')
  }

  const config = normalizeStorefrontConfig(draft.config)
  const releases = db.collection('storefront_releases')
  const latestResult = await releases
    .where({ store_id: storeId, status: 'published' })
    .orderBy('version', 'desc')
    .limit(1)
    .get()
  const version = Number(latestResult.data[0]?.version || 0) + 1

  await releases.add({
    data: {
      store_id: storeId,
      version,
      status: 'published',
      config,
      source_revision: draft.revision,
      published_by: membership.user_id,
      published_at: db.serverDate(),
    },
  })
  await drafts.doc(draft._id).update({
    data: {
      published_version: version,
      published_at: db.serverDate(),
      updated_at: db.serverDate(),
    },
  })

  return {
    storeId,
    version,
    config,
  }
}

async function getPublishedStorefront(payload) {
  const storeId = readStoreId(payload)
  const store = await requireActiveStore(storeId)
  const result = await db.collection('storefront_releases')
    .where({ store_id: storeId, status: 'published' })
    .orderBy('version', 'desc')
    .limit(1)
    .get()
  const release = result.data[0]

  if (!release) {
    throw new ApiError('STOREFRONT_NOT_PUBLISHED', '门店主页尚未发布')
  }

  return {
    store: {
      id: store._id,
      name: store.name,
      address: store.address || '',
      businessHours: store.business_hours || '',
    },
    version: release.version,
    config: release.config,
  }
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
  return { ...membership, user_id: user._id }
}

async function requireEditableStore(storeId) {
  const result = await db.collection('stores').doc(storeId).get()
  const store = result.data
  if (!store) {
    throw new ApiError('STORE_NOT_FOUND', '没有找到对应门店')
  }
  if (store.status === 'disabled') {
    throw new ApiError('STORE_DISABLED', '当前门店已停用')
  }
  return store
}

async function requireActiveStore(storeId) {
  const result = await db.collection('stores').doc(storeId).get()
  const store = result.data
  if (!store || store.status !== 'active') {
    throw new ApiError('STORE_UNAVAILABLE', '当前门店暂不可用')
  }
  return store
}

function readStoreId(payload) {
  const storeId = String(payload.storeId || '').trim()
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(storeId)) {
    throw new ApiError('INVALID_STORE_ID', '门店信息无效')
  }
  return storeId
}

function formatDraft(draft) {
  return {
    storeId: draft.store_id,
    config: draft.config,
    revision: Number(draft.revision || 0),
    publishedVersion: Number(draft.published_version || 0),
  }
}

function normalizeRequestId(value) {
  const requestId = String(value || '').trim()
  return /^[a-zA-Z0-9_-]{8,80}$/.test(requestId)
    ? requestId
    : `server_${Date.now().toString(36)}`
}
