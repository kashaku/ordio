<template>
  <view class="menu-page">
    <view v-if="store" class="store-header">
      <view class="store-cover">
        <image v-if="store.cover" :src="store.cover" mode="aspectFill" />
        <text v-else>{{ store.name.slice(0, 1) }}</text>
      </view>
      <view class="store-copy">
        <text class="store-name">{{ store.name }}</text>
        <text class="store-meta">{{ tableLabel }}</text>
        <text class="store-meta">{{ store.address || '地址未设置' }}</text>
      </view>
      <button class="orders-button" size="mini" @tap="goOrders">订单</button>
    </view>

    <view v-if="loading" class="empty-state">正在读取菜单…</view>
    <view v-else-if="!menu" class="empty-state">
      <text>该店铺暂时没有已发布菜单</text>
    </view>
    <view v-else class="menu-layout">
      <scroll-view class="category-list" scroll-y>
        <view
          v-for="category in menu.categories"
          :key="category.id"
          class="category-item"
          :class="{ active: activeCategoryId === category.id }"
          @tap="activeCategoryId = category.id"
        >
          {{ category.name }}
        </view>
      </scroll-view>

      <scroll-view class="dish-list" scroll-y>
        <text class="category-title">{{ activeCategory?.name }}</text>
        <dish-card
          v-for="dish in activeDishes"
          :key="dish.id"
          :dish="dish"
          @select="selectDish"
        />
        <view v-if="!activeDishes.length" class="empty-state">该分类暂无菜品</view>
      </scroll-view>
    </view>

    <cart-panel
      :items="displayCartItems"
      :count="cartStore.totalQuantity"
      :total-in-cents="cartTotal"
      @change="changeQuantity"
      @checkout="goCheckout"
    />

    <spec-popup
      :visible="Boolean(selectedDish)"
      :dish="selectedDish"
      @close="selectedDish = null"
      @confirm="confirmSpecs"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'

import CartPanel from '../../components/cart-panel/cart-panel.vue'
import DishCard from '../../components/dish-card/dish-card.vue'
import SpecPopup from '../../components/spec-popup/spec-popup.vue'
import { priceCartItem, resolveCart } from '../../services/order-service'
import { getPublishedMenu, getStore, resolveTableToken } from '../../services/repository'
import { useCartStore } from '../../stores/cart'

const cartStore = useCartStore()
const storeId = ref('')
const tableToken = ref('')
const store = ref(null)
const table = ref(null)
const menu = ref(null)
const activeCategoryId = ref('')
const selectedDish = ref(null)
const loading = ref(true)

const activeCategory = computed(() =>
  menu.value?.categories.find((item) => item.id === activeCategoryId.value),
)

const activeDishes = computed(() =>
  menu.value?.dishes.filter((item) => item.categoryId === activeCategoryId.value) || [],
)

const displayCartItems = computed(() => {
  if (!menu.value) {
    return []
  }
  return cartStore.currentItems
    .map((item) => {
      const priced = priceCartItem(item, menu.value)
      return priced
        ? {
            ...priced,
            specText: priced.selectedSpecs.map((spec) => spec.optionName).join(' / '),
          }
        : null
    })
    .filter(Boolean)
})

const cartTotal = computed(() =>
  menu.value ? cartStore.totalInCents(menu.value) : 0,
)
const tableLabel = computed(() => {
  if (!table.value) {
    return store.value?.businessHours || '营业时间未设置'
  }
  return `${table.value.area ? `${table.value.area} · ` : ''}${table.value.name}桌`
})

onLoad((options) => {
  storeId.value = options.storeId || ''
  tableToken.value = options.tableToken || ''
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
  if (tableToken.value) {
    const result = await resolveTableToken(tableToken.value)
    if (!result || !result.table.enabled || result.store.id !== storeId.value) {
      store.value = null
      menu.value = null
      loading.value = false
      uni.showToast({ title: '桌码已失效，请重新扫码', icon: 'none' })
      return
    }
    table.value = result.table
  } else {
    table.value = null
  }
  const [storeResult, menuResult] = await Promise.all([
    getStore(storeId.value),
    getPublishedMenu(storeId.value),
    cartStore.load(storeId.value),
  ])
  store.value = storeResult
  menu.value = menuResult
  if (menuResult) {
    const cartResult = await resolveCart(storeId.value, cartStore.currentItems)
    if (cartResult.invalidItems.length) {
      await cartStore.replaceItems(storeId.value, cartResult.validCartItems)
      uni.showToast({ title: '已移除失效购物车商品', icon: 'none' })
    }
  }
  if (menuResult?.categories.length) {
    const exists = menuResult.categories.some((item) => item.id === activeCategoryId.value)
    activeCategoryId.value = exists ? activeCategoryId.value : menuResult.categories[0].id
  }
  loading.value = false
}

async function selectDish(dish) {
  if (dish.specs?.length) {
    selectedDish.value = dish
    return
  }
  await addToCart(dish, [])
}

async function confirmSpecs(selectedSpecs) {
  const dish = selectedDish.value
  selectedDish.value = null
  await addToCart(dish, selectedSpecs)
}

async function addToCart(dish, selectedSpecs) {
  await cartStore.addItem(storeId.value, dish.id, selectedSpecs)
  uni.showToast({ title: '已加入购物车', icon: 'success' })
}

async function changeQuantity(key, quantity) {
  await cartStore.setQuantity(storeId.value, key, quantity)
}

function goCheckout() {
  const tableQuery = tableToken.value
    ? `&tableToken=${encodeURIComponent(tableToken.value)}`
    : ''
  uni.navigateTo({
    url: `/pages/customer/checkout?storeId=${encodeURIComponent(storeId.value)}${tableQuery}`,
  })
}

function goOrders() {
  uni.navigateTo({
    url: `/pages/customer/orders?storeId=${encodeURIComponent(storeId.value)}`,
  })
}
</script>

<style scoped>
.menu-page {
  min-height: 100vh;
  padding-bottom: 250rpx;
  background: #fff;
}

.store-header {
  display: flex;
  min-height: 190rpx;
  padding: 28rpx;
  align-items: center;
  background: #171717;
  color: #fff;
}

.store-cover,
.store-cover image {
  width: 112rpx;
  height: 112rpx;
  border-radius: 18rpx;
}

.store-cover {
  display: flex;
  flex: 0 0 112rpx;
  align-items: center;
  justify-content: center;
  background: #f5b000;
  color: #171717;
  font-size: 44rpx;
  font-weight: 800;
}

.store-copy {
  min-width: 0;
  margin-left: 22rpx;
  flex: 1;
}

.store-name {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
}

.store-meta {
  display: block;
  margin-top: 8rpx;
  overflow: hidden;
  color: #c8c1b7;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orders-button {
  padding: 14rpx 18rpx;
  color: #fff;
  background: #343434;
}

.menu-layout {
  display: flex;
  height: calc(100vh - 190rpx);
}

.category-list {
  width: 190rpx;
  height: 100%;
  flex: 0 0 190rpx;
  background: #f4f0e9;
}

.category-item {
  padding: 34rpx 22rpx;
  color: #625d55;
  font-size: 26rpx;
}

.category-item.active {
  border-left: 8rpx solid #f5b000;
  background: #fff;
  color: #171717;
  font-weight: 700;
}

.dish-list {
  height: 100%;
  padding: 28rpx;
  flex: 1;
}

.category-title {
  display: block;
  padding-bottom: 10rpx;
  font-size: 32rpx;
  font-weight: 800;
}
</style>
