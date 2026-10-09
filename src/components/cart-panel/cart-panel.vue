<template>
  <view v-if="items.length" class="cart-wrap">
    <view class="cart-list">
      <view v-for="item in items" :key="item.key" class="cart-row">
        <view class="cart-copy">
          <text class="cart-name">{{ item.name }}</text>
          <text v-if="item.specText" class="cart-spec">{{ item.specText }}</text>
          <text class="cart-price">{{ formatMoney(item.unitPriceInCents) }}</text>
        </view>
        <view class="quantity">
          <button size="mini" @tap="$emit('change', item.key, item.quantity - 1)">−</button>
          <text>{{ item.quantity }}</text>
          <button size="mini" @tap="$emit('change', item.key, item.quantity + 1)">＋</button>
        </view>
      </view>
    </view>
    <view class="cart-bar">
      <view>
        <text class="cart-count">{{ count }} 件</text>
        <text class="cart-total">{{ formatMoney(totalInCents) }}</text>
      </view>
      <button class="checkout-button" @tap="$emit('checkout')">去结算</button>
    </view>
  </view>
</template>

<script setup>
import { formatMoney } from '../../utils/money'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  count: {
    type: Number,
    default: 0,
  },
  totalInCents: {
    type: Number,
    default: 0,
  },
})

defineEmits(['change', 'checkout'])
</script>

<style scoped>
.cart-wrap {
  position: fixed;
  z-index: 40;
  right: 20rpx;
  bottom: 24rpx;
  left: 20rpx;
  overflow: hidden;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 12rpx 42rpx rgba(30, 24, 15, 0.2);
}

.cart-list {
  max-height: 420rpx;
  padding: 0 24rpx;
  overflow-y: auto;
}

.cart-row {
  display: flex;
  padding: 22rpx 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eee8de;
}

.cart-copy {
  display: flex;
  flex-direction: column;
}

.cart-name {
  font-weight: 700;
}

.cart-spec {
  margin-top: 6rpx;
  color: #746f67;
  font-size: 22rpx;
}

.cart-price {
  margin-top: 6rpx;
  color: #b85c38;
  font-size: 24rpx;
}

.quantity {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.quantity button {
  width: 54rpx;
  height: 50rpx;
  padding: 0;
  background: #f2eee6;
  line-height: 50rpx;
}

.cart-bar {
  display: flex;
  min-height: 100rpx;
  padding-left: 28rpx;
  align-items: center;
  justify-content: space-between;
  background: #171717;
}

.cart-count {
  display: block;
  color: #c8c1b7;
  font-size: 22rpx;
}

.cart-total {
  color: #fff;
  font-size: 34rpx;
  font-weight: 700;
}

.checkout-button {
  height: 100rpx;
  padding: 0 42rpx;
  border-radius: 0;
  background: #f5b000;
  font-weight: 700;
  line-height: 100rpx;
}
</style>
