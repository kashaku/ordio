<template>
  <view class="page orders-page">
    <view class="orders-heading">
      <text class="eyebrow">LOCAL ORDERS</text>
      <text class="title">{{ store?.name || '历史订单' }}</text>
      <text class="muted">仅显示当前设备保存的订单。</text>
    </view>

    <view v-if="loading" class="empty-state">正在读取订单…</view>
    <view v-else-if="!orders.length" class="card empty-card">
      <text>还没有订单</text>
      <button class="primary-button" @tap="goMenu">去点餐</button>
    </view>
    <template v-else>
      <view
        v-for="order in orders"
        :key="order.id"
        class="order-card card"
        @tap="openOrder(order)"
      >
        <view class="order-top">
          <text class="order-status" :class="order.status">
            {{ order.status === 'paid' ? '已付款' : '待付款' }}
          </text>
          <text class="order-time">{{ formatDate(order.createdAt) }}</text>
        </view>
        <text class="order-dishes">{{ order.items.map((item) => `${item.name} × ${item.quantity}`).join('、') }}</text>
        <view class="order-bottom">
          <text class="order-id">{{ order.id }}</text>
          <text class="order-total">{{ formatMoney(order.totalInCents) }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import { getStore, listOrders } from '../../services/repository'
import { formatMoney } from '../../utils/money'

const storeId = ref('')
const store = ref(null)
const orders = ref([])
const loading = ref(true)

onLoad((options) => {
  storeId.value = options.storeId || ''
})

onShow(async () => {
  loading.value = true
  ;[store.value, orders.value] = await Promise.all([
    getStore(storeId.value),
    listOrders(storeId.value),
  ])
  loading.value = false
})

function formatDate(value) {
  const date = new Date(value)
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getMonth() + 1}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function openOrder(order) {
  uni.navigateTo({
    url: `/pages/customer/order-detail?orderId=${encodeURIComponent(order.id)}`,
  })
}

function goMenu() {
  uni.navigateTo({
    url: `/pages/customer/menu?storeId=${encodeURIComponent(storeId.value)}`,
  })
}
</script>

<style scoped>
.orders-heading {
  padding: 24rpx 4rpx 36rpx;
}

.eyebrow {
  color: #9a7628;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.title {
  display: block;
  margin: 10rpx 0;
  font-size: 44rpx;
  font-weight: 800;
}

.order-card {
  margin-bottom: 22rpx;
  padding: 26rpx;
}

.order-top,
.order-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-status {
  padding: 8rpx 15rpx;
  border-radius: 20rpx;
  background: #fff3d0;
  color: #8d6512;
  font-size: 22rpx;
  font-weight: 700;
}

.order-status.paid {
  background: #e2f2e8;
  color: #2f7d57;
}

.order-time,
.order-id {
  color: #8b857b;
  font-size: 21rpx;
}

.order-dishes {
  display: block;
  margin: 24rpx 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-id {
  max-width: 430rpx;
  overflow: hidden;
  font-family: monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-total {
  color: #b85c38;
  font-size: 31rpx;
  font-weight: 800;
}

.empty-card {
  padding: 70rpx 30rpx;
  text-align: center;
}

.empty-card button {
  margin-top: 28rpx;
  padding: 22rpx;
}
</style>
