<template>
  <view class="page home">
    <view class="brand-block">
      <text class="eyebrow">ORDIO LOCAL MVP</text>
      <text class="title">一台设备，跑通一次点餐</text>
      <text class="subtitle">商家维护并发布菜单，顾客随后完成选餐、下单和模拟付款。</text>
    </view>

    <view class="role-grid">
      <view class="role-card merchant-card" @tap="goMerchant">
        <text class="role-index">01</text>
        <text class="role-title">商家端</text>
        <text class="role-description">编辑店铺、分类、菜品和规格，然后发布菜单。</text>
        <text class="role-action">进入工作台 →</text>
      </view>

      <view class="role-card customer-card" @tap="goCustomer">
        <text class="role-index">02</text>
        <text class="role-title">顾客端</text>
        <text class="role-description">扫码或进入演示店铺，选择菜品并提交订单。</text>
        <text class="role-action">开始点餐 →</text>
      </view>
    </view>

    <view class="tool-card card">
      <view>
        <text class="tool-title">演示数据</text>
        <text class="tool-copy">重置会清空本机购物车和订单，恢复初始菜单。</text>
      </view>
      <button class="reset-button" size="mini" @tap="confirmReset">重置</button>
    </view>

    <text class="local-note">当前版本仅保存到本机微信小程序缓存，不支持跨设备同步。</text>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'

import { initializeRepository, resetDemoData } from '../../services/repository'
import { useCartStore } from '../../stores/cart'

const cartStore = useCartStore()

onShow(() => {
  initializeRepository()
})

function goMerchant() {
  uni.navigateTo({ url: '/pages/merchant/index' })
}

function goCustomer() {
  uni.navigateTo({ url: '/pages/customer/scan' })
}

function confirmReset() {
  uni.showModal({
    title: '重置演示数据',
    content: '店铺、菜单、购物车和订单都会恢复为初始状态。',
    confirmColor: '#B85C38',
    success: async (result) => {
      if (!result.confirm) {
        return
      }
      await resetDemoData()
      cartStore.resetState()
      uni.showToast({ title: '已重置', icon: 'success' })
    },
  })
}
</script>

<style scoped>
.home {
  padding-top: 76rpx;
}

.brand-block {
  padding: 24rpx 4rpx 48rpx;
}

.eyebrow {
  color: #8d6a22;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.title {
  display: block;
  margin-top: 18rpx;
  font-size: 56rpx;
  font-weight: 800;
  line-height: 1.15;
}

.subtitle {
  display: block;
  margin-top: 24rpx;
  color: #625d55;
  line-height: 1.7;
}

.role-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.role-card {
  min-height: 280rpx;
  padding: 32rpx;
  border-radius: 20rpx;
}

.merchant-card {
  color: #fff;
  background: #171717;
}

.customer-card {
  color: #171717;
  background: #f5b000;
}

.role-index {
  opacity: 0.6;
  font-size: 22rpx;
}

.role-title {
  display: block;
  margin-top: 30rpx;
  font-size: 42rpx;
  font-weight: 800;
}

.role-description {
  display: block;
  margin-top: 14rpx;
  max-width: 570rpx;
  opacity: 0.78;
  line-height: 1.55;
}

.role-action {
  display: block;
  margin-top: 32rpx;
  font-weight: 700;
}

.tool-card {
  display: flex;
  margin-top: 28rpx;
  padding: 26rpx;
  align-items: center;
  justify-content: space-between;
}

.tool-title {
  display: block;
  font-weight: 700;
}

.tool-copy {
  display: block;
  margin-top: 8rpx;
  color: #746f67;
  font-size: 22rpx;
}

.reset-button {
  padding: 15rpx 23rpx;
  color: #b85c38;
  background: #f7ede8;
}

.local-note {
  display: block;
  padding: 34rpx 12rpx;
  color: #8b857b;
  font-size: 22rpx;
  line-height: 1.6;
  text-align: center;
}
</style>
