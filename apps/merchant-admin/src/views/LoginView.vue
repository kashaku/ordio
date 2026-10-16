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
        <p>为门店选择主页样式，编辑公告和介绍，预览顾客看到的内容。</p>
      </div>
    </section>

    <section class="login-form-panel">
      <div class="login-card">
        <p class="eyebrow">商家入口</p>
        <h2>登录管理后台</h2>
        <p class="login-hint">登录成功后，系统会按门店成员关系加载可管理的门店。</p>

        <p v-if="merchantSession.error" class="form-error">{{ merchantSession.error }}</p>
        <button class="primary-action" type="button" :disabled="!merchantApiConfigured" @click="login">
          登录管理后台
        </button>
        <p v-if="!merchantApiConfigured" class="config-hint">商家登录服务暂未开通。</p>

        <button v-if="localAccessAvailable" class="development-action" type="button" @click="enterLocal">
          预览工作台
        </button>
        <p v-if="localAccessAvailable" class="development-note">预览内容仅保存在当前浏览器，不会同步到顾客小程序。</p>
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
