<template>
  <view class="welcome-page">
    <view class="brand-mark">O</view>
    <text class="brand-name">ORDIO</text>

    <view class="welcome-copy">
      <text class="eyebrow">SCAN · DISCOVER · ORDER</text>
      <text class="title">每家店，<br />都有自己的味道。</text>
      <text class="subtitle">扫描门店桌牌，进入商家专属主页，查看招牌推荐并开始点餐。</text>
    </view>

    <button class="scan-button" @tap="goScan">扫码进入门店</button>

    <view class="feature-row">
      <view class="feature-item">
        <text class="feature-index">01</text>
        <text>门店专属主页</text>
      </view>
      <view class="feature-item">
        <text class="feature-index">02</text>
        <text>实时发布菜单</text>
      </view>
      <view class="feature-item">
        <text class="feature-index">03</text>
        <text>便捷点餐下单</text>
      </view>
    </view>
  </view>
</template>

<script setup>
function goScan() {
  uni.navigateTo({ url: '/pages/customer/scan' })
}
</script>

<style scoped>
.welcome-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  padding: 72rpx 38rpx calc(48rpx + env(safe-area-inset-bottom));
  flex-direction: column;
  overflow: hidden;
  background: #171717;
  color: #fff;
}

.welcome-page::after {
  position: absolute;
  width: 520rpx;
  height: 520rpx;
  right: -230rpx;
  bottom: 170rpx;
  border: 80rpx solid #f5b000;
  border-radius: 50%;
  content: '';
  opacity: 0.9;
}

.brand-mark {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5b000;
  color: #171717;
  font-size: 36rpx;
  font-weight: 900;
}

.brand-name {
  margin-top: 18rpx;
  font-size: 20rpx;
  font-weight: 800;
  letter-spacing: 7rpx;
}

.welcome-copy {
  position: relative;
  z-index: 2;
  margin-top: 150rpx;
}

.eyebrow {
  color: #f5b000;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.title {
  display: block;
  margin-top: 24rpx;
  font-size: 66rpx;
  font-weight: 800;
  line-height: 1.2;
}

.subtitle {
  display: block;
  max-width: 560rpx;
  margin-top: 30rpx;
  color: #c8c1b7;
  line-height: 1.75;
}

.scan-button {
  position: relative;
  z-index: 2;
  margin-top: 60rpx;
  padding: 27rpx;
  background: #f5b000;
  color: #171717;
  font-weight: 800;
}

.feature-row {
  position: relative;
  z-index: 2;
  display: grid;
  margin-top: auto;
  padding-top: 70rpx;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.feature-item {
  display: flex;
  color: #d6d0c7;
  font-size: 21rpx;
  line-height: 1.45;
  flex-direction: column;
}

.feature-index {
  margin-bottom: 12rpx;
  color: #f5b000;
  font-size: 19rpx;
  font-weight: 800;
}
</style>
