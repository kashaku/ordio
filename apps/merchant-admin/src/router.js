import { createRouter, createWebHistory } from 'vue-router'

import { merchantSession, restoreMerchantSession } from './services/merchant-session'
import DashboardView from './views/DashboardView.vue'
import LoginView from './views/LoginView.vue'
import StorefrontView from './views/StorefrontView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/storefront', name: 'storefront', component: StorefrontView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  if (merchantSession.status === 'idle') {
    await restoreMerchantSession()
  }
  if (to.meta.requiresAuth && !merchantSession.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && merchantSession.user) {
    return { name: 'dashboard' }
  }
})
