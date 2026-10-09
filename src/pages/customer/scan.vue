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
      <text class="description">二维码只需要携带店铺标识。开发阶段可以直接进入默认演示店铺。</text>
      <button class="primary-button scan-button" :loading="scanning" @tap="scanCode">打开扫码</button>
      <button class="secondary-button demo-button" @tap="openStore('store-demo')">进入演示店铺</button>
    </view>

    <view class="tips card">
      <text class="tips-title">支持的内容</text>
      <text class="tip-line">store-demo</text>
      <text class="tip-line">https://example.com/menu?storeId=store-demo</text>
      <text class="tip-line">scene=storeId%3Dstore-demo</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import { getStore } from '../../services/repository'
import { parseStoreId } from '../../utils/scan'

const scanning = ref(false)

onLoad((options) => {
  const incoming = options.storeId || options.scene
  if (incoming) {
    const storeId = parseStoreId(incoming)
    if (storeId) {
      openStore(storeId)
    }
  }
})

async function openStore(storeId) {
  const store = await getStore(storeId)
  if (!store) {
    uni.showToast({ title: '没有找到对应店铺', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/customer/menu?storeId=${encodeURIComponent(storeId)}`,
  })
}

function scanCode() {
  scanning.value = true
  uni.scanCode({
    scanType: ['qrCode'],
    success: async (result) => {
      const storeId = parseStoreId(result.result || result.path)
      if (!storeId) {
        uni.showToast({ title: '二维码中没有有效店铺标识', icon: 'none' })
        return
      }
      await openStore(storeId)
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

.scan-button,
.demo-button {
  padding: 24rpx;
}

.demo-button {
  margin-top: 18rpx;
  color: #fff;
  background: #343434;
}

.tips {
  margin-top: 28rpx;
  padding: 28rpx;
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
  font-family: monospace;
  font-size: 22rpx;
  word-break: break-all;
}
</style>
