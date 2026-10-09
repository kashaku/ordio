const envId = String(import.meta.env.VITE_CLOUDBASE_ENV || '').trim()
const functionName = String(import.meta.env.VITE_CLOUDBASE_FUNCTION || 'ordioApi').trim()

let initialized = false

export function isCloudConfigured() {
  return Boolean(envId && functionName)
}

export function initializeCloud() {
  if (!isCloudConfigured()) {
    return false
  }
  if (initialized) {
    return true
  }

  // #ifdef MP-WEIXIN
  if (!wx.cloud) {
    throw new Error('当前微信基础库不支持云开发')
  }
  wx.cloud.init({ env: envId, traceUser: true })
  initialized = true
  return true
  // #endif

  // #ifndef MP-WEIXIN
  return false
  // #endif
}

export async function callCloud(action, payload = {}) {
  if (!initializeCloud()) {
    const error = new Error('CloudBase 环境尚未配置')
    error.code = 'CLOUD_NOT_CONFIGURED'
    throw error
  }

  const response = await wx.cloud.callFunction({
    name: functionName,
    data: {
      action,
      payload,
      requestId: createRequestId(),
    },
  })
  const result = response.result
  if (!result?.ok) {
    const error = new Error(result?.error?.message || '云服务调用失败')
    error.code = result?.error?.code || 'CLOUD_CALL_FAILED'
    error.requestId = result?.requestId || ''
    throw error
  }
  return result.data
}

function createRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
