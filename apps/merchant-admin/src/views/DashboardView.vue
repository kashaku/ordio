<template>
  <AdminShell>
    <div class="content-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">STORE OVERVIEW</p>
          <h1>{{ currentStore?.storeName || '经营概览' }}</h1>
          <p>商家管理端已从顾客小程序拆分，后续模块按服务端权限逐项接入。</p>
        </div>
        <RouterLink class="primary-link" to="/storefront">继续搭建主页</RouterLink>
      </div>

      <section class="status-grid">
        <article class="status-card ready">
          <span>主页搭建</span>
          <strong>可预览</strong>
          <p>模板、品牌色和首屏文案已迁移到独立管理端。</p>
        </article>
        <article class="status-card">
          <span>订单工作台</span>
          <strong>待接入</strong>
          <p>服务端订单状态机完成后接入，不读取小程序本地订单。</p>
        </article>
        <article class="status-card">
          <span>菜单与桌台</span>
          <strong>迁移中</strong>
          <p>云端数据接口完成前，现有开发页继续作为迁移参照。</p>
        </article>
      </section>

      <section class="work-section">
        <div>
          <p class="eyebrow">CURRENT STAGE</p>
          <h2>先完成入口和权限，再迁移业务写入</h2>
        </div>
        <ol class="stage-list">
          <li class="done"><span>01</span><div><strong>顾客与商家入口拆分</strong><p>顾客留在微信小程序，商家使用独立管理端。</p></div></li>
          <li class="active"><span>02</span><div><strong>商家身份与门店权限</strong><p>接入登录服务并校验 store_members。</p></div></li>
          <li><span>03</span><div><strong>云端主页、菜单和桌台</strong><p>所有保存和发布都经过服务端。</p></div></li>
          <li><span>04</span><div><strong>订单工作台</strong><p>接单、制作和出餐状态跨设备同步。</p></div></li>
        </ol>
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
