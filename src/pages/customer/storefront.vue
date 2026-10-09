<template>
  <view
    v-if="store && storefront"
    class="storefront-page"
    :class="`template-${storefront.templateId}`"
    :style="{ '--accent': storefront.accentColor }"
  >
    <view class="hero" :class="{ 'has-cover': store.cover }">
      <image v-if="store.cover" class="hero-cover" :src="store.cover" mode="aspectFill" />
      <view class="hero-shade" />
      <view class="hero-content">
        <text class="hero-eyebrow">{{ storefront.hero.eyebrow }}</text>
        <text class="hero-title">{{ storefront.hero.title }}</text>
        <text class="hero-subtitle">{{ storefront.hero.subtitle }}</text>
        <button class="hero-button" @tap="goMenu">
          {{ storefront.hero.buttonText || '开始点餐' }}
        </button>
      </view>
    </view>

    <view class="store-strip">
      <view>
        <text class="store-name">{{ store.name }}</text>
        <text class="store-hours">{{ store.businessHours || '营业时间以门店为准' }}</text>
      </view>
      <button class="orders-button" size="mini" @tap="goOrders">我的订单</button>
    </view>

    <view class="block-list">
      <template v-for="block in visibleBlocks" :key="block.id">
        <view v-if="block.type === 'notice'" class="content-block notice-block">
          <text class="block-kicker">NOTICE</text>
          <text class="block-title">{{ block.title }}</text>
          <text class="block-copy">{{ block.content }}</text>
        </view>

        <view v-else-if="block.type === 'featured'" class="content-block featured-block">
          <view class="block-heading">
            <view>
              <text class="block-kicker">SIGNATURE</text>
              <text class="block-title">{{ block.title }}</text>
            </view>
            <text class="link-text" @tap="goMenu">查看菜单</text>
          </view>
          <scroll-view class="featured-scroll" scroll-x enable-flex>
            <view v-for="dish in featuredDishes" :key="dish.id" class="featured-card" @tap="goMenu">
              <view class="featured-image">
                <image v-if="dish.image" :src="dish.image" mode="aspectFill" />
                <text v-else>{{ dish.name.slice(0, 1) }}</text>
              </view>
              <text class="featured-name">{{ dish.name }}</text>
              <text class="featured-description">{{ dish.description || '到店现做' }}</text>
              <text class="featured-price">{{ formatMoney(dish.priceInCents) }}</text>
            </view>
          </scroll-view>
        </view>

        <view v-else-if="block.type === 'story'" class="content-block story-block">
          <text class="block-kicker">OUR STORY</text>
          <text class="block-title">{{ block.title }}</text>
          <text class="block-copy">{{ block.content }}</text>
        </view>

        <view v-else-if="block.type === 'storeInfo'" class="content-block info-block">
          <text class="block-kicker">VISIT</text>
          <text class="block-title">{{ block.title }}</text>
          <view class="info-row">
            <text>地址</text>
            <text>{{ store.address || '请联系门店' }}</text>
          </view>
          <view class="info-row">
            <text>营业时间</text>
            <text>{{ store.businessHours || '请联系门店' }}</text>
          </view>
        </view>
      </template>
    </view>

    <view class="bottom-action">
      <button class="menu-button" @tap="goMenu">{{ storefront.hero.buttonText || '开始点餐' }}</button>
    </view>
  </view>

  <view v-else-if="loading" class="empty-state">正在读取门店主页…</view>
  <view v-else class="empty-state">
    <text>门店主页暂未发布</text>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'

import { getPublishedMenu, getPublishedStorefront, getStore } from '../../services/repository'
import { formatMoney } from '../../utils/money'

const storeId = ref('')
const store = ref(null)
const storefront = ref(null)
const menu = ref(null)
const loading = ref(true)

const visibleBlocks = computed(() => storefront.value?.blocks.filter((block) => block.visible) || [])
const featuredDishes = computed(() => {
  const ids = new Set(storefront.value?.featuredDishIds || [])
  return menu.value?.dishes.filter((dish) => ids.has(dish.id)) || []
})

onLoad((options) => {
  storeId.value = options.storeId || ''
})

onShow(loadPage)

onPullDownRefresh(async () => {
  await loadPage()
  uni.stopPullDownRefresh()
})

async function loadPage() {
  if (!storeId.value) {
    loading.value = false
    return
  }
  loading.value = true
  const [storeResult, storefrontResult, menuResult] = await Promise.all([
    getStore(storeId.value),
    getPublishedStorefront(storeId.value),
    getPublishedMenu(storeId.value),
  ])
  store.value = storeResult
  storefront.value = storefrontResult
  menu.value = menuResult
  loading.value = false
}

function goMenu() {
  uni.navigateTo({
    url: `/pages/customer/menu?storeId=${encodeURIComponent(storeId.value)}`,
  })
}

function goOrders() {
  uni.navigateTo({
    url: `/pages/customer/orders?storeId=${encodeURIComponent(storeId.value)}`,
  })
}
</script>

<style scoped>
.storefront-page {
  min-height: 100vh;
  padding-bottom: 150rpx;
  background: #f7f1e7;
}

.hero {
  position: relative;
  min-height: 610rpx;
  overflow: hidden;
  background: #1b1a18;
  color: #fff;
}

.hero-cover,
.hero-shade {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
}

.hero-shade {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.8));
}

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 610rpx;
  padding: 96rpx 42rpx 54rpx;
  flex-direction: column;
  justify-content: flex-end;
}

.hero-eyebrow,
.block-kicker {
  color: var(--accent);
  font-size: 21rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
}

.hero-title {
  display: block;
  max-width: 620rpx;
  margin-top: 16rpx;
  font-size: 62rpx;
  font-weight: 800;
  line-height: 1.12;
}

.hero-subtitle {
  display: block;
  margin-top: 22rpx;
  color: #e5ddd1;
  line-height: 1.65;
}

.hero-button {
  width: 260rpx;
  margin-top: 34rpx;
  padding: 23rpx;
  background: var(--accent);
  color: #fff;
  font-weight: 800;
}

.store-strip {
  display: flex;
  padding: 28rpx 32rpx;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}

.store-name,
.store-hours {
  display: block;
}

.store-name {
  font-size: 32rpx;
  font-weight: 800;
}

.store-hours {
  margin-top: 8rpx;
  color: #776f65;
  font-size: 22rpx;
}

.orders-button {
  padding: 15rpx 18rpx;
  color: var(--accent);
  background: #f4eee5;
  font-weight: 700;
}

.block-list {
  padding: 10rpx 24rpx 40rpx;
}

.content-block {
  margin-top: 24rpx;
  padding: 32rpx;
  border-radius: 22rpx;
  background: #fff;
}

.block-title {
  display: block;
  margin-top: 12rpx;
  font-size: 36rpx;
  font-weight: 800;
}

.block-copy {
  display: block;
  margin-top: 16rpx;
  color: #675f56;
  line-height: 1.75;
}

.block-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.link-text {
  color: var(--accent);
  font-size: 24rpx;
  font-weight: 700;
}

.featured-scroll {
  display: flex;
  width: 100%;
  margin-top: 24rpx;
  white-space: nowrap;
}

.featured-card {
  display: inline-flex;
  width: 270rpx;
  margin-right: 18rpx;
  padding-bottom: 12rpx;
  vertical-align: top;
  flex-direction: column;
  white-space: normal;
}

.featured-image,
.featured-image image {
  width: 270rpx;
  height: 190rpx;
  border-radius: 16rpx;
}

.featured-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee4d6;
  color: var(--accent);
  font-size: 60rpx;
  font-weight: 800;
}

.featured-name {
  margin-top: 16rpx;
  font-weight: 800;
}

.featured-description {
  height: 62rpx;
  margin-top: 8rpx;
  overflow: hidden;
  color: #776f65;
  font-size: 22rpx;
  line-height: 1.4;
}

.featured-price {
  margin-top: 10rpx;
  color: var(--accent);
  font-weight: 800;
}

.story-block {
  color: #fff;
  background: #24211e;
}

.story-block .block-copy {
  color: #d7cfc4;
}

.info-row {
  display: grid;
  margin-top: 20rpx;
  padding-top: 20rpx;
  grid-template-columns: 130rpx 1fr;
  gap: 16rpx;
  border-top: 1rpx solid #eee6dc;
  color: #675f56;
  line-height: 1.5;
}

.info-row text:last-child {
  text-align: right;
}

.bottom-action {
  position: fixed;
  z-index: 20;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #e7ded3;
  background: rgba(255, 255, 255, 0.96);
}

.menu-button {
  padding: 24rpx;
  background: var(--accent);
  color: #fff;
  font-weight: 800;
}

.template-fresh {
  background: #eef5ef;
}

.template-fresh .hero {
  min-height: 560rpx;
  border-radius: 0 0 70rpx 70rpx;
  background: #20382d;
}

.template-fresh .hero-content {
  min-height: 560rpx;
}

.template-fresh .content-block {
  border-radius: 34rpx;
}

.template-bold {
  background: #f0ede7;
}

.template-bold .hero {
  min-height: 560rpx;
  background: var(--accent);
}

.template-bold .hero-content {
  min-height: 560rpx;
}

.template-bold .hero-eyebrow {
  color: #fff;
}

.template-bold .hero-button {
  color: #171717;
  background: #fff;
}

.template-bold .content-block {
  border: 3rpx solid #171717;
  border-radius: 8rpx;
  box-shadow: 10rpx 10rpx 0 #171717;
}
</style>
