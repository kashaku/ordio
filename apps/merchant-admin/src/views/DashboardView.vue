<template>
  <AdminShell>
    <div class="content-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">STORE OVERVIEW</p>
          <h1>{{ currentStore?.storeName || '经营概览' }}</h1>
          <p>设置门店主页，让顾客了解门店特色与到店信息。</p>
        </div>
        <RouterLink class="primary-link" to="/storefront">继续搭建主页</RouterLink>
      </div>

      <section class="status-grid">
        <article class="status-card ready">
          <span>主页搭建</span>
          <strong>可预览</strong>
          <p>选择模板、品牌色，调整首屏和内容区块。</p>
        </article>
        <article class="status-card">
          <span>订单工作台</span>
          <strong>暂未开放</strong>
          <p>暂不支持在此接收或处理订单。</p>
        </article>
        <article class="status-card">
          <span>菜单与桌台</span>
          <strong>暂未开放</strong>
          <p>暂不支持在此修改菜单和桌台。</p>
        </article>
      </section>

    </div>
  </AdminShell>
</template>

<script setup>
import { computed } from 'vue'

import AdminShell from '../components/AdminShell.vue'
import { merchantSession } from '../services/merchant-session'

const currentStore = computed(() => merchantSession.memberships[0] || null)
</script>
