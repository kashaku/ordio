import { reactive } from 'vue'

const apiBase = String(import.meta.env.VITE_MERCHANT_API_BASE || '').replace(/\/$/, '')
const devSessionKey = 'ordio:merchant-admin:dev-session'

export const merchantSession = reactive({
  status: 'idle',
  user: null,
  memberships: [],
  error: '',
})

export const merchantApiConfigured = Boolean(apiBase)
export const localAccessAvailable = import.meta.env.DEV

export async function restoreMerchantSession() {
  merchantSession.status = 'loading'
  merchantSession.error = ''

  if (import.meta.env.DEV && sessionStorage.getItem(devSessionKey) === '1') {
    setDevelopmentSession()
    return
  }

  if (!merchantApiConfigured) {
    merchantSession.status = 'anonymous'
    return
  }

  try {
    const response = await fetch(`${apiBase}/merchant/session`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (response.status === 401) {
      merchantSession.status = 'anonymous'
      return
    }
    if (!response.ok) {
      throw new Error(`登录状态读取失败（${response.status}）`)
    }
    const data = await response.json()
    merchantSession.user = data.user
    merchantSession.memberships = data.memberships || []
    merchantSession.status = 'authenticated'
  } catch (error) {
    merchantSession.status = 'anonymous'
    merchantSession.error = error.message || '暂时无法读取登录状态'
  }
}

export function beginMerchantLogin(returnTo = '/') {
  if (!merchantApiConfigured) {
    throw new Error('商家登录服务尚未配置')
  }
  const url = new URL(`${apiBase}/merchant/login`)
  url.searchParams.set('returnTo', new URL(returnTo, window.location.origin).toString())
  window.location.assign(url)
}

export function enterDevelopmentSession() {
  if (!import.meta.env.DEV) {
    throw new Error('生产环境不支持本地开发会话')
  }
  sessionStorage.setItem(devSessionKey, '1')
  setDevelopmentSession()
}

export async function signOut() {
  sessionStorage.removeItem(devSessionKey)
  if (merchantApiConfigured) {
    await fetch(`${apiBase}/merchant/logout`, { method: 'POST', credentials: 'include' })
  }
  merchantSession.user = null
  merchantSession.memberships = []
  merchantSession.status = 'anonymous'
}

function setDevelopmentSession() {
  merchantSession.user = { id: 'local-developer', name: '开发预览' }
  merchantSession.memberships = [{ storeId: 'store-demo', storeName: '禾间小馆', role: 'owner' }]
  merchantSession.status = 'authenticated'
}
