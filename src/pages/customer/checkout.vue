<template>
  <view class="page checkout-page">
    <view v-if="store" class="checkout-heading">
      <text class="eyebrow">确认订单</text>
      <text class="title">{{ store.name }}</text>
      <text v-if="table" class="table-badge">{{ table.area ? `${table.area} · ` : '' }}{{ table.name }}桌</text>
      <text class="muted">价格按当前已发布菜单重新核对。</text>
    </view>

    <view v-if="loading" class="empty-state">正在核对购物车…</view>
    <view v-else-if="!resolvedItems.length" class="card empty-card">
      <text>购物车为空</text>
      <button class="primary-button" @tap="backToMenu">返回菜单</button>
    </view>

    <template v-else>
      <view class="card order-card">
        <view v-for="item in resolvedItems" :key="item.key" class="order-row">
          <view class="item-copy">
            <text class="item-name">{{ item.name }} × {{ item.quantity }}</text>
            <text v-if="item.selectedSpecs.length" class="item-spec">
              {{ item.selectedSpecs.map((spec) => spec.optionName).join(' / ') }}
            </text>
            <text class="item-unit">{{ formatMoney(item.unitPriceInCents) }} / 份</text>
          </view>
          <text class="item-subtotal">{{ formatMoney(item.subtotalInCents) }}</text>
        </view>
        <view class="total-row">
          <text>合计</text>
          <text class="total-price">{{ formatMoney(totalInCents) }}</text>
        </view>
      </view>

      <view class="notice card">
        <text class="notice-title">订单说明</text>
        <text class="notice-copy">提交后会生成待付款订单，在线支付将在服务端接入后开放。</text>
      </view>

      <view v-if="!table" class="table-warning card">
        <text class="notice-title">需要确认桌台</text>
        <text class="notice-copy">当前入口没有桌台信息，请返回首页重新扫描桌码。</text>
      </view>

      <button
        class="primary-button submit-button"
        :disabled="!table"
        :loading="submitting"
        @tap="submitOrder"
      >
        提交订单
      </button>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

import { createOrder, resolveCart } from '../../services/order-service'
import { getStore, resolveTableToken } from '../../services/repository'
import { useCartStore } from '../../stores/cart'
import { formatMoney } from '../../utils/money'

const cartStore = useCartStore()
const storeId = ref('')
const tableToken = ref('')
const store = ref(null)
const table = ref(null)
const cartResult = ref(null)
const loading = ref(true)
const submitting = ref(false)

const resolvedItems = computed(() => cartResult.value?.items || [])
const totalInCents = computed(() => cartResult.value?.totalInCents || 0)

onLoad((options) => {
  storeId.value = options.storeId || ''
  tableToken.value = options.tableToken || ''
})

onShow(loadCheckout)

async function loadCheckout() {
  if (!storeId.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    if (tableToken.value) {
      const result = await resolveTableToken(tableToken.value)
      if (!result || !result.table.enabled || result.store.id !== storeId.value) {
        throw new Error('桌码已失效，请重新扫码')
      }
      table.value = result.table
    } else {
      table.value = null
    }
    store.value = await getStore(storeId.value)
    await cartStore.load(storeId.value)
    const result = await resolveCart(storeId.value, cartStore.currentItems)
    if (result.invalidItems.length) {
      await cartStore.replaceItems(storeId.value, result.validCartItems)
      uni.showModal({
        title: '购物车已更新',
        content: '部分菜品或规格已经失效，已从购物车移除。',
        showCancel: false,
      })
    }
    cartResult.value = result
  } catch (error) {
    cartResult.value = null
    uni.showToast({ title: error.message || '购物车核对失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (!cartStore.currentItems.length) {
    return
  }
  if (!table.value) {
    uni.showToast({ title: '请先扫描桌码确认桌台', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const order = await createOrder(storeId.value, cartStore.currentItems, {
      tableToken: tableToken.value,
    })
    await cartStore.clear(storeId.value)
    uni.redirectTo({
      url: `/pages/customer/order-detail?orderId=${encodeURIComponent(order.id)}`,
    })
  } catch (error) {
    if (error.code === 'INVALID_CART') {
      await cartStore.replaceItems(storeId.value, error.validCartItems || [])
      await loadCheckout()
      return
    }
    uni.showToast({ title: error.message || '订单提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function backToMenu() {
  uni.navigateBack()
}
</script>

<style scoped>
.checkout-page {
  padding-bottom: 48rpx;
}

.checkout-heading {
  padding: 24rpx 4rpx 36rpx;
}

.table-badge {
  display: inline-block;
  margin: 18rpx 0 14rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #171717;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
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
  padding: 8rpx 28rpx;
}

.order-row {
  display: flex;
  padding: 24rpx 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eee8de;
}

.item-copy {
  min-width: 0;
  padding-right: 20rpx;
  flex: 1;
}

.item-name,
.item-spec,
.item-unit {
  display: block;
}

.item-name {
  font-weight: 700;
}

.item-spec,
.item-unit {
  margin-top: 7rpx;
  color: #746f67;
  font-size: 22rpx;
}

.item-subtotal {
  font-weight: 700;
}

.total-row {
  display: flex;
  padding: 28rpx 0;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
}

.total-price {
  color: #b85c38;
  font-size: 38rpx;
}

.notice {
  margin-top: 24rpx;
  padding: 26rpx;
}

.table-warning {
  margin-top: 20rpx;
  padding: 26rpx;
  border-color: #e6c7bc;
  background: #fff8f5;
}

.notice-title,
.notice-copy {
  display: block;
}

.notice-title {
  font-weight: 700;
}

.notice-copy {
  margin-top: 8rpx;
  color: #746f67;
  font-size: 23rpx;
  line-height: 1.6;
}

.submit-button {
  margin-top: 28rpx;
  padding: 26rpx;
}

.submit-button[disabled] {
  background: #b8b1a7;
  color: #f5f2ed;
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
