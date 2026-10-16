<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">O</span>
        <span>
          <strong>ORDIO</strong>
          <small>商家管理端</small>
        </span>
      </RouterLink>

      <nav class="nav-list">
        <RouterLink to="/" exact-active-class="active">经营概览</RouterLink>
        <RouterLink to="/storefront" active-class="active">主页搭建</RouterLink>
      </nav>

      <div class="sidebar-footer">
        <span>{{ currentStore?.storeName || '尚未选择门店' }}</span>
        <small>{{ roleLabel }}</small>
        <button type="button" @click="logout">退出</button>
        <small v-if="logoutError">{{ logoutError }}</small>
      </div>
    </aside>

    <main class="admin-main">
      <header class="mobile-header">
        <RouterLink class="brand compact" to="/">
          <span class="brand-mark">O</span>
          <strong>ORDIO</strong>
        </RouterLink>
        <RouterLink class="mobile-builder-link" to="/storefront">主页搭建</RouterLink>
      </header>
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { merchantSession, signOut } from '../services/merchant-session'

const router = useRouter()
const logoutError = ref('')
const currentStore = computed(() => merchantSession.memberships[0] || null)
const roleLabel = computed(() => ({ owner: '店主', manager: '管理员' }[currentStore.value?.role] || '未授权'))

async function logout() {
  try {
    await signOut()
    router.replace('/login')
  } catch {
    logoutError.value = '退出失败，请重试'
  }
}
</script>
