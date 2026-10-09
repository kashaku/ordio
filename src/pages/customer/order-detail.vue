<template>
  <view class="page detail-page">
    <view v-if="loading" class="empty-state">正在读取订单…</view>
    <view v-else-if="!order" class="empty-state">订单不存在</view>
    <template v-else>
      <view class="result-card" :class="order.status">
        <text class="result-kicker">{{ order.status === 'paid' ? 'PAYMENT COMPLETE' : 'ORDER CREATED' }}</text>
        <text class="result-title">{{ order.status === 'paid' ? '已付款' : '待付款' }}</text>
        <text class="order-id">{{ order.id }}</text>
      </view>

      <view class="card detail-card">
        <view class="detail-line">
          <text class="muted">创建时间</text>
          <text>{{ formatDate(order.createdAt) }}</text>
        </view>
        <view v-if="order.tableName" class="detail-line">
          <text class="muted">桌台</text>
          <text>{{ order.tableName }}桌</text>
        </view>
        <view v-if="order.paidAt" class="detail-line">
          <text class="muted">付款时间</text>
          <text>{{ formatDate(order.paidAt) }}</text>
        </view>
        <view class="detail-line">
          <text class="muted">订单金额</text>
          <text class="amount">{{ formatMoney(order.totalInCents) }}</text>
        </view>
      </view>

      <view class="card items-card">
        <text class="section-title">商品快照</text>
        <view v-for="item in order.items" :key="item.key" class="item-row">
          <view>
            <text class="item-name">{{ item.name }} × {{ item.quantity }}</text>
            <text v-if="item.selectedSpecs.length" class="item-spec">
              {{ item.selectedSpecs.map((spec) => spec.optionName).join(' / ') }}
            </text>
            <text class="item-spec">{{ formatMoney(item.unitPriceInCents) }} / 份</text>
          </view>
          <text>{{ formatMoney(item.subtotalInCents) }}</text>
        </view>
      </view>

      <button
        v-if="order.status === 'pending'"
        class="primary-button pay-button"
        :loading="paying"
        @tap="pay"
      >
        模拟付款
      </button>
      <button class="secondary-button nav-button" @tap="goOrders">查看历史订单</button>
      <button class="secondary-button nav-button" @tap="goMenu">继续点餐</button>
    </template>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import { getOrder, payOrder } from '../../services/repository'
import { formatMoney } from '../../utils/money'

const orderId = ref('')
const order = ref(null)
const loading = ref(true)
const paying = ref(false)

onLoad((options) => {
  orderId.value = options.orderId || ''
})

onShow(loadOrder)

async function loadOrder() {
  loading.value = true
  order.value = await getOrder(orderId.value)
  loading.value = false
}

function formatDate(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function pay() {
  paying.value = true
  try {
    order.value = await payOrder(orderId.value)
    uni.showToast({ title: '付款完成', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '付款失败', icon: 'none' })
  } finally {
    paying.value = false
  }
}

function goOrders() {
  uni.navigateTo({
    url: `/pages/customer/orders?storeId=${encodeURIComponent(order.value.storeId)}`,
  })
}

function goMenu() {
  uni.navigateTo({
    url: `/pages/customer/menu?storeId=${encodeURIComponent(order.value.storeId)}`,
  })
}
</script>

<style scoped>
.result-card {
  padding: 42rpx 32rpx;
  border-radius: 20rpx;
  background: #f5b000;
}

.result-card.paid {
  background: #2f7d57;
  color: #fff;
}

.result-kicker,
.result-title,
.order-id {
  display: block;
}

.result-kicker {
  opacity: 0.65;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.result-title {
  margin-top: 12rpx;
  font-size: 50rpx;
  font-weight: 800;
}

.order-id {
  margin-top: 18rpx;
  font-family: monospace;
  font-size: 22rpx;
  word-break: break-all;
}

.detail-card,
.items-card {
  margin-top: 24rpx;
  padding: 26rpx;
}

.detail-line {
  display: flex;
  padding: 13rpx 0;
  align-items: center;
  justify-content: space-between;
}

.amount {
  color: #b85c38;
  font-size: 34rpx;
  font-weight: 800;
}

.section-title {
  font-size: 30rpx;
  font-weight: 800;
}

.item-row {
  display: flex;
  padding: 22rpx 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eee8de;
}

.item-name,
.item-spec {
  display: block;
}

.item-name {
  font-weight: 700;
}

.item-spec {
  margin-top: 7rpx;
  color: #746f67;
  font-size: 22rpx;
}

.pay-button,
.nav-button {
  margin-top: 24rpx;
  padding: 25rpx;
}
</style>
