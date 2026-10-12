const apiBase = String(import.meta.env.VITE_MERCHANT_API_BASE || '').replace(/\/$/, '')

export async function getStorefrontDraft(storeId) {
  return request(`/merchant/stores/${encodeURIComponent(storeId)}/storefront/draft`)
}

export async function saveStorefrontDraft(storeId, config, revision) {
  return request(`/merchant/stores/${encodeURIComponent(storeId)}/storefront/draft`, {
    method: 'PUT',
    body: JSON.stringify({ config, revision }),
  })
}

export async function publishStorefront(storeId, revision) {
  return request(`/merchant/stores/${encodeURIComponent(storeId)}/storefront/publish`, {
    method: 'POST',
    body: JSON.stringify({ revision }),
  })
}

async function request(path, options = {}) {
  if (!apiBase) {
    throw new Error('商家 API 尚未配置')
  }
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (response.status === 401) {
    throw new Error('登录状态已失效，请重新登录')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(result?.error?.message || `请求失败（${response.status}）`)
  }
  return result?.data ?? result
}
