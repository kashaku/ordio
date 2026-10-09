<template>
  <view v-if="visible && dish" class="overlay" @tap="close">
    <view class="sheet" @tap.stop>
      <view class="sheet-header">
        <view>
          <text class="sheet-title">{{ dish.name }}</text>
          <text class="base-price">基础价 {{ formatMoney(dish.priceInCents) }}</text>
        </view>
        <button class="close-button" size="mini" @tap="close">关闭</button>
      </view>

      <view v-for="group in dish.specs" :key="group.id" class="spec-group">
        <view class="group-heading">
          <text class="group-name">{{ group.name }}</text>
          <text class="group-rule">{{ group.required ? '必选' : '可选' }}</text>
        </view>
        <view class="option-list">
          <button
            v-for="option in group.options"
            :key="option.id"
            class="option-button"
            :class="{ active: selected[group.id] === option.id }"
            size="mini"
            @tap="selectOption(group, option)"
          >
            {{ option.name }}
            <text v-if="option.priceDeltaInCents"> +{{ formatMoney(option.priceDeltaInCents) }}</text>
          </button>
        </view>
      </view>

      <button class="confirm-button" @tap="confirm">加入购物车</button>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

import { formatMoney } from '../../utils/money'

const props = defineProps({
  visible: Boolean,
  dish: Object,
})

const emit = defineEmits(['close', 'confirm'])
const selected = ref({})

watch(
  () => [props.visible, props.dish?.id],
  () => {
    if (props.visible) {
      selected.value = {}
    }
  },
)

function selectOption(group, option) {
  const next = { ...selected.value }
  if (!group.required && next[group.id] === option.id) {
    delete next[group.id]
  } else {
    next[group.id] = option.id
  }
  selected.value = next
}

function close() {
  emit('close')
}

function confirm() {
  const missing = props.dish.specs.find((group) => group.required && !selected.value[group.id])
  if (missing) {
    uni.showToast({ title: `请选择${missing.name}`, icon: 'none' })
    return
  }

  const result = Object.entries(selected.value).map(([groupId, optionId]) => ({
    groupId,
    optionId,
  }))
  emit('confirm', result)
}
</script>

<style scoped>
.overlay {
  position: fixed;
  z-index: 100;
  right: 0;
  bottom: 0;
  left: 0;
  top: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.45);
}

.sheet {
  width: 100%;
  max-height: 78vh;
  padding: 32rpx;
  overflow-y: auto;
  border-radius: 28rpx 28rpx 0 0;
  background: #fff;
}

.sheet-header,
.group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.base-price,
.group-rule {
  color: #746f67;
  font-size: 24rpx;
}

.close-button {
  padding: 12rpx 18rpx;
  background: #f2eee6;
}

.spec-group {
  margin-top: 34rpx;
}

.group-name {
  font-weight: 700;
}

.option-list {
  display: flex;
  margin-top: 18rpx;
  flex-wrap: wrap;
  gap: 16rpx;
}

.option-button {
  padding: 16rpx 24rpx;
  border: 1rpx solid #ddd3c3;
  background: #fff;
}

.option-button.active {
  border-color: #f5b000;
  background: #fff5d8;
}

.confirm-button {
  margin-top: 40rpx;
  padding: 25rpx;
  color: #171717;
  background: #f5b000;
  font-weight: 700;
}
</style>
