<template>
  <view class="page scan-page">
    <view class="scan-card">
      <view class="scan-mark">
        <view class="corner top-left" />
        <view class="corner top-right" />
        <view class="corner bottom-left" />
        <view class="corner bottom-right" />
        <text>扫</text>
      </view>
      <text class="title">扫描店铺二维码</text>
      <text class="description">请扫描桌牌或门店提供的二维码，进入对应门店主页。</text>
      <button class="primary-button scan-button" :loading="scanning || resolving" @tap="scanCode">打开扫码</button>
    </view>

    <view v-if="entryError" class="entry-error card">
      <text class="entry-error-title">暂时无法进入</text>
      <text class="entry-error-copy">{{ entryError }}</text>
      <button class="secondary-button retry-button" @tap="scanCode">重新扫码</button>
    </view>

    <view class="tips card">
      <text class="tips-title">扫码后可以</text>
      <text class="tip-line">查看商家主页与招牌推荐</text>
      <text class="tip-line">浏览当前已发布菜单</text>
      <text class="tip-line">进入购物车并完成下单</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import { buildStorefrontUrl, resolveCustomerEntry } from '../../services/entry-service'
import { entryPayloadFromOptions } from '../../utils/scan'

const scanning = ref(false)
const resolving = ref(false)
const entryError = ref('')

onLoad((options) => {
  const incoming = entryPayloadFromOptions(options)
  if (incoming) {
    openEntry(incoming)
  }
})

async function openEntry(rawValue) {
  resolving.value = true
  entryError.value = ''
  try {
    const entry = await resolveCustomerEntry(rawValue)
    uni.navigateTo({ url: buildStorefrontUrl(entry) })
  } catch (error) {
    entryError.value = error.message || '桌码读取失败，请重新扫码'
  } finally {
    resolving.value = false
  }
}

function scanCode() {
  scanning.value = true
  uni.scanCode({
    scanType: ['qrCode'],
    success: async (result) => {
      await openEntry(result.result || result.path)
    },
    fail: (error) => {
      if (!String(error.errMsg || '').includes('cancel')) {
        uni.showToast({ title: '扫码失败，请重试', icon: 'none' })
      }
    },
    complete: () => {
      scanning.value = false
    },
  })
}
</script>

<style scoped>
.scan-page {
  padding-top: 64rpx;
}

.scan-card {
  padding: 50rpx 34rpx;
  border-radius: 24rpx;
  background: #171717;
  color: #fff;
  text-align: center;
}

.scan-mark {
  position: relative;
  display: flex;
  width: 230rpx;
  height: 230rpx;
  margin: 0 auto 36rpx;
  align-items: center;
  justify-content: center;
  background: #282828;
  color: #f5b000;
  font-size: 70rpx;
  font-weight: 800;
}

.corner {
  position: absolute;
  width: 48rpx;
  height: 48rpx;
  border-color: #f5b000;
}

.top-left { left: 0; top: 0; border-left: 7rpx solid; border-top: 7rpx solid; }
.top-right { right: 0; top: 0; border-right: 7rpx solid; border-top: 7rpx solid; }
.bottom-left { bottom: 0; left: 0; border-bottom: 7rpx solid; border-left: 7rpx solid; }
.bottom-right { bottom: 0; right: 0; border-bottom: 7rpx solid; border-right: 7rpx solid; }

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
}

.description {
  display: block;
  margin: 18rpx auto 34rpx;
  color: #c8c1b7;
  line-height: 1.6;
}

.scan-button {
  padding: 24rpx;
}

.tips {
  margin-top: 28rpx;
  padding: 28rpx;
}

.entry-error {
  margin-top: 28rpx;
  padding: 28rpx;
  border-color: #e6c7bc;
  background: #fff8f5;
}

.entry-error-title,
.entry-error-copy {
  display: block;
}

.entry-error-title {
  color: #9b452e;
  font-weight: 800;
}

.entry-error-copy {
  margin-top: 10rpx;
  color: #725c55;
  line-height: 1.6;
}

.retry-button {
  margin-top: 20rpx;
  padding: 18rpx;
}

.tips-title,
.tip-line {
  display: block;
}

.tips-title {
  margin-bottom: 15rpx;
  font-weight: 700;
}

.tip-line {
  margin-top: 9rpx;
  color: #746f67;
  font-size: 24rpx;
}
</style>
