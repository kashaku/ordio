<template>
  <view class="dish-card">
    <image v-if="dish.image" class="dish-image" :src="dish.image" mode="aspectFill" />
    <view v-else class="dish-image placeholder">餐</view>
    <view class="dish-body">
      <text class="dish-name">{{ dish.name }}</text>
      <text class="dish-description">{{ dish.description || '暂无描述' }}</text>
      <view class="dish-footer">
        <text class="dish-price">{{ formatMoney(dish.priceInCents) }}</text>
        <button class="add-button" size="mini" @tap="$emit('select', dish)">
          {{ dish.specs?.length ? '选规格' : '加入' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { formatMoney } from '../../utils/money'

defineProps({
  dish: {
    type: Object,
    required: true,
  },
})

defineEmits(['select'])
</script>

<style scoped>
.dish-card {
  display: flex;
  gap: 20rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eee8de;
}

.dish-image {
  display: flex;
  width: 152rpx;
  height: 152rpx;
  flex: 0 0 152rpx;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: #eee7da;
}

.placeholder {
  color: #a79372;
  font-size: 50rpx;
  font-weight: 700;
}

.dish-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.dish-name {
  font-size: 30rpx;
  font-weight: 700;
}

.dish-description {
  display: -webkit-box;
  margin-top: 10rpx;
  overflow: hidden;
  color: #746f67;
  font-size: 24rpx;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.dish-footer {
  display: flex;
  margin-top: auto;
  align-items: flex-end;
  justify-content: space-between;
}

.dish-price {
  color: #b85c38;
  font-size: 31rpx;
  font-weight: 700;
}

.add-button {
  padding: 13rpx 20rpx;
  color: #171717;
  background: #f5b000;
  font-weight: 700;
}
</style>
