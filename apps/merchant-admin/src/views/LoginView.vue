<template>
  <main class="login-page">
    <section class="login-brand-panel">
      <div class="brand large">
        <span class="brand-mark">O</span>
        <span>
          <strong>ORDIO</strong>
          <small>商家管理端</small>
        </span>
      </div>
      <div class="login-copy">
        <p class="eyebrow">STORE OPERATIONS</p>
        <h1>管理门店，也保留每家店自己的样子。</h1>
        <p>订单、菜单、主页和桌台统一管理。顾客小程序与商家后台入口完全分开。</p>
      </div>
    </section>

    <section class="login-form-panel">
      <div class="login-card">
        <p class="eyebrow">商家入口</p>
        <h2>登录管理后台</h2>
        <p class="login-hint">登录成功后，系统会按门店成员关系加载可管理的门店。</p>

        <p v-if="merchantSession.error" class="form-error">{{ merchantSession.error }}</p>
        <button class="primary-action" type="button" :disabled="!merchantApiConfigured" @click="login">
          微信扫码登录
        </button>
        <p v-if="!merchantApiConfigured" class="config-hint">当前尚未配置商家登录服务，生产构建会停留在此页。</p>

        <button v-if="localAccessAvailable" class="development-action" type="button" @click="enterLocal">
          进入开发预览
        </button>
        <p v-if="localAccessAvailable" class="development-note">仅开发服务器提供此入口，不会进入生产构建。</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

import {
  beginMerchantLogin,
  enterDevelopmentSession,
  localAccessAvailable,
  merchantApiConfigured,
  merchantSession,
} from '../services/merchant-session'

const route = useRoute()
const router = useRouter()

function login() {
  try {
    beginMerchantLogin(route.query.redirect || '/')
  } catch (error) {
    merchantSession.error = error.message
  }
}

function enterLocal() {
  enterDevelopmentSession()
  router.replace(route.query.redirect || '/')
}
</script>
