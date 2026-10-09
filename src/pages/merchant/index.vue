<template>
  <view class="page merchant-page">
    <view v-if="loading" class="empty-state">正在读取商家数据…</view>
    <template v-else>
      <view class="status-card">
        <view class="status-group">
          <view>
          <text class="status-label">当前菜单</text>
          <text class="status-value" :class="{ published: publishStatus === '已发布' }">
            {{ publishStatus }}
          </text>
          <text v-if="published?.publishedAt" class="status-time">
            最近发布 {{ formatDate(published.publishedAt) }}
          </text>
          </view>
          <view>
            <text class="status-label">门店主页</text>
            <text class="status-value" :class="{ published: homePublishStatus === '已发布' }">
              {{ homePublishStatus }}
            </text>
          </view>
        </view>
        <button class="preview-button" size="mini" @tap="previewStorefront">主页预览</button>
      </view>

      <view class="section card">
        <view class="section-heading">
          <view>
            <text class="section-index">01</text>
            <text class="section-title">店铺资料</text>
          </view>
        </view>

        <view class="cover-row">
          <view class="cover-preview" @tap="chooseCover">
            <image v-if="storeForm.cover" :src="storeForm.cover" mode="aspectFill" />
            <text v-else>选择封面</text>
          </view>
          <button v-if="storeForm.cover" class="small-button" size="mini" @tap="clearCover">清除</button>
        </view>

        <text class="field-label">店铺名称</text>
        <input v-model="storeForm.name" class="field-input" maxlength="40" @input="markStoreDirty" />
        <text class="field-label">地址</text>
        <input v-model="storeForm.address" class="field-input" maxlength="80" @input="markStoreDirty" />
        <text class="field-label">营业时间</text>
        <input v-model="storeForm.businessHours" class="field-input" maxlength="40" @input="markStoreDirty" />
        <button
          class="store-save-button"
          size="mini"
          :disabled="!storeDirty"
          :loading="savingStore"
          @tap="saveStoreOnly"
        >
          保存店铺资料
        </button>
      </view>

      <view class="section card">
        <view class="section-heading">
          <view>
            <text class="section-index">02</text>
            <text class="section-title">主页搭建</text>
          </view>
          <text class="section-count">{{ homePublishStatus }}</text>
        </view>

        <text class="builder-help">选择模板后调整品牌色、首屏文案和内容区块，无需从空白页面开始。</text>

        <text class="field-label">页面模板</text>
        <scroll-view class="template-scroll" scroll-x enable-flex>
          <view
            v-for="template in storefrontTemplates"
            :key="template.id"
            class="template-option"
            :class="[`template-choice-${template.id}`, { active: homeDraft.templateId === template.id }]"
            @tap="chooseTemplate(template)"
          >
            <view class="template-swatch" :style="{ backgroundColor: template.defaultAccent }" />
            <text class="template-name">{{ template.name }}</text>
            <text class="template-description">{{ template.description }}</text>
          </view>
        </scroll-view>

        <text class="field-label">品牌色</text>
        <view class="color-row">
          <view
            v-for="color in storefrontAccentColors"
            :key="color"
            class="color-option"
            :class="{ active: homeDraft.accentColor === color }"
            :style="{ backgroundColor: color }"
            @tap="setAccent(color)"
          />
        </view>

        <text class="field-label">首屏短标</text>
        <input v-model="homeDraft.hero.eyebrow" class="field-input" maxlength="20" @input="markHomeDirty" />
        <text class="field-label">主页标题</text>
        <input v-model="homeDraft.hero.title" class="field-input" maxlength="32" @input="markHomeDirty" />
        <text class="field-label">主页副标题</text>
        <textarea v-model="homeDraft.hero.subtitle" class="field-textarea short" maxlength="80" @input="markHomeDirty" />
        <text class="field-label">点餐按钮文案</text>
        <input v-model="homeDraft.hero.buttonText" class="field-input" maxlength="12" @input="markHomeDirty" />

        <view class="block-builder-heading">
          <view>
            <text class="field-label">主页区块</text>
            <text class="builder-help">可以隐藏区块，或调整顾客看到的先后顺序。</text>
          </view>
        </view>

        <view v-for="(block, index) in homeDraft.blocks" :key="block.id" class="builder-block">
          <view class="builder-block-top">
            <view>
              <text class="builder-block-type">{{ blockTypeName(block.type) }}</text>
              <text class="builder-block-order">第 {{ index + 1 }} 屏</text>
            </view>
            <view class="block-actions">
              <button size="mini" :disabled="index === 0" @tap="moveBlock(index, -1)">上移</button>
              <button size="mini" :disabled="index === homeDraft.blocks.length - 1" @tap="moveBlock(index, 1)">下移</button>
              <switch color="#F5B000" :checked="block.visible" @change="toggleBlock(block, $event)" />
            </view>
          </view>
          <input v-model="block.title" class="field-input compact" maxlength="24" @input="markHomeDirty" />
          <textarea
            v-if="block.type === 'notice' || block.type === 'story'"
            v-model="block.content"
            class="field-textarea short"
            maxlength="160"
            @input="markHomeDirty"
          />
        </view>

        <view class="featured-picker">
          <text class="field-label">招牌菜选择</text>
          <text class="builder-help">最多选择 4 个，显示在主页横向推荐区。</text>
          <view class="featured-options">
            <view
              v-for="dish in draft.dishes"
              :key="dish.id"
              class="featured-option"
              :class="{ active: homeDraft.featuredDishIds.includes(dish.id) }"
              @tap="toggleFeaturedDish(dish.id)"
            >
              {{ dish.name }}
            </view>
          </view>
        </view>

        <view class="homepage-actions">
          <button class="secondary-button" :loading="savingHome" @tap="saveHomepageDraft">保存主页草稿</button>
          <button class="primary-button" :loading="publishingHome" @tap="publishHomepage">发布主页</button>
        </view>
      </view>

      <view class="section card">
        <view class="section-heading">
          <view>
            <text class="section-index">03</text>
            <text class="section-title">菜品分类</text>
          </view>
          <text class="section-count">{{ draft.categories.length }} 个</text>
        </view>

        <view v-for="category in draft.categories" :key="category.id" class="category-row">
          <input v-model="category.name" class="inline-input" maxlength="20" @input="markMenuDirty" />
          <button class="delete-text" size="mini" @tap="deleteCategory(category)">删除</button>
        </view>

        <view class="add-row">
          <input v-model="newCategoryName" class="inline-input" placeholder="新分类名称" maxlength="20" />
          <button class="small-primary" size="mini" @tap="addCategory">添加</button>
        </view>
      </view>

      <view class="section card">
        <view class="section-heading">
          <view>
            <text class="section-index">04</text>
            <text class="section-title">菜品和规格</text>
          </view>
          <button class="small-primary" size="mini" :disabled="!draft.categories.length" @tap="openDishEditor()">
            新增菜品
          </button>
        </view>

        <view v-for="dish in sortedDishes" :key="dish.id" class="dish-row">
          <view class="dish-thumb">
            <image v-if="dish.image" :src="dish.image" mode="aspectFill" />
            <text v-else>餐</text>
          </view>
          <view class="dish-copy">
            <text class="dish-name">{{ dish.name }}</text>
            <text class="dish-meta">
              {{ categoryName(dish.categoryId) }} · {{ formatMoney(dish.priceInCents) }}
            </text>
            <text class="dish-meta">{{ dish.specs.length }} 组规格</text>
          </view>
          <view class="dish-actions">
            <button size="mini" @tap="openDishEditor(dish)">编辑</button>
            <button class="delete-text" size="mini" @tap="deleteDish(dish)">删除</button>
          </view>
        </view>
        <view v-if="!draft.dishes.length" class="empty-state">还没有菜品</view>
      </view>

      <view class="action-bar">
        <button class="secondary-button" :loading="savingDraft" @tap="saveDraftOnly">保存草稿</button>
        <button class="primary-button" :loading="publishing" @tap="publish">发布菜单</button>
      </view>
    </template>

    <view v-if="dishForm" class="editor-overlay" @tap="closeDishEditor">
      <scroll-view class="editor-sheet" scroll-y @tap.stop>
        <view class="editor-header">
          <text class="editor-title">{{ editingDishId ? '编辑菜品' : '新增菜品' }}</text>
          <button size="mini" @tap="closeDishEditor">关闭</button>
        </view>

        <view class="dish-image-row">
          <view class="dish-image-editor" @tap="chooseDishImage">
            <image v-if="dishForm.image" :src="dishForm.image" mode="aspectFill" />
            <text v-else>选择图片</text>
          </view>
          <button v-if="dishForm.image" size="mini" @tap="dishForm.image = ''">清除</button>
        </view>

        <text class="field-label">菜品名称</text>
        <input v-model="dishForm.name" class="field-input" maxlength="40" />

        <text class="field-label">分类</text>
        <picker :range="categoryNames" :value="categoryPickerIndex" @change="changeDishCategory">
          <view class="picker-field">{{ categoryName(dishForm.categoryId) || '请选择分类' }}</view>
        </picker>

        <text class="field-label">价格（元）</text>
        <input v-model="dishForm.priceYuan" class="field-input" type="digit" placeholder="0.00" />

        <text class="field-label">描述</text>
        <textarea v-model="dishForm.description" class="field-textarea" maxlength="160" />

        <view class="spec-heading">
          <text class="field-label">规格设置</text>
          <button class="small-primary" size="mini" @tap="addSpecGroup">添加规格组</button>
        </view>

        <view v-for="(group, groupIndex) in dishForm.specs" :key="group.id" class="spec-card">
          <view class="spec-top">
            <input v-model="group.name" class="inline-input" placeholder="规格组名称" maxlength="20" />
            <view class="required-control">
              <text>必选</text>
              <switch
                color="#F5B000"
                :checked="group.required"
                @change="group.required = $event.detail.value"
              />
            </view>
            <button class="delete-text" size="mini" @tap="removeSpecGroup(groupIndex)">删除组</button>
          </view>

          <view v-for="(option, optionIndex) in group.options" :key="option.id" class="option-row">
            <input v-model="option.name" class="option-name" placeholder="选项名称" maxlength="20" />
            <input v-model="option.priceDeltaYuan" class="option-price" type="digit" placeholder="加价" />
            <button class="delete-text" size="mini" @tap="removeSpecOption(groupIndex, optionIndex)">删除</button>
          </view>
          <button class="add-option" size="mini" @tap="addSpecOption(groupIndex)">添加选项</button>
        </view>

        <button class="primary-button save-dish" @tap="saveDish">保存菜品</button>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import {
  getDraftStorefront,
  getDraftMenu,
  getPublishedMenu,
  getPublishedStorefront,
  getStore,
  publishMenu,
  publishStorefront,
  saveDraftMenu,
  saveDraftStorefront,
  saveStore,
} from '../../services/repository'
import { storefrontAccentColors, storefrontTemplates } from '../../data/storefront-templates'
import { createId } from '../../utils/id'
import { choosePersistentImage } from '../../utils/media'
import { centsToYuanInput, formatMoney, parseYuanToCents } from '../../utils/money'

const STORE_ID = 'store-demo'
const loading = ref(true)
const savingStore = ref(false)
const savingDraft = ref(false)
const publishing = ref(false)
const savingHome = ref(false)
const publishingHome = ref(false)
const storeDirty = ref(false)
const menuDirty = ref(false)
const homeDirty = ref(false)
const storeForm = ref({
  id: STORE_ID,
  name: '',
  cover: '',
  address: '',
  businessHours: '',
})
const draft = ref({ categories: [], dishes: [] })
const published = ref(null)
const homeDraft = ref(null)
const publishedHome = ref(null)
const newCategoryName = ref('')
const dishForm = ref(null)
const editingDishId = ref('')

const sortedDishes = computed(() => {
  const order = new Map(draft.value.categories.map((item, index) => [item.id, index]))
  return [...draft.value.dishes].sort((a, b) => {
    return (order.get(a.categoryId) ?? 999) - (order.get(b.categoryId) ?? 999)
  })
})

const categoryNames = computed(() => draft.value.categories.map((item) => item.name))
const categoryPickerIndex = computed(() => {
  const index = draft.value.categories.findIndex((item) => item.id === dishForm.value?.categoryId)
  return index < 0 ? 0 : index
})

const publishStatus = computed(() => {
  if (!published.value) {
    return '未发布'
  }
  if (menuDirty.value) {
    return '有未发布修改'
  }
  const draftTime = new Date(draft.value.updatedAt || 0).getTime()
  const publishedTime = new Date(published.value.publishedAt || 0).getTime()
  return draftTime > publishedTime ? '有未发布修改' : '已发布'
})

const homePublishStatus = computed(() => {
  if (!publishedHome.value) {
    return '未发布'
  }
  if (homeDirty.value) {
    return '有未发布修改'
  }
  const draftTime = new Date(homeDraft.value?.updatedAt || 0).getTime()
  const publishedTime = new Date(publishedHome.value.publishedAt || 0).getTime()
  return draftTime > publishedTime ? '有未发布修改' : '已发布'
})

onShow(loadPage)

async function loadPage() {
  loading.value = true
  const [store, draftMenu, publishedMenu, draftStorefront, publishedStorefront] = await Promise.all([
    getStore(STORE_ID),
    getDraftMenu(STORE_ID),
    getPublishedMenu(STORE_ID),
    getDraftStorefront(STORE_ID),
    getPublishedStorefront(STORE_ID),
  ])
  storeForm.value = store
  draft.value = draftMenu
  published.value = publishedMenu
  homeDraft.value = draftStorefront
  publishedHome.value = publishedStorefront
  storeDirty.value = false
  menuDirty.value = false
  homeDirty.value = false
  loading.value = false
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function markStoreDirty() {
  storeDirty.value = true
}

function markMenuDirty() {
  menuDirty.value = true
}

function markHomeDirty() {
  homeDirty.value = true
}

function chooseTemplate(template) {
  homeDraft.value.templateId = template.id
  homeDraft.value.accentColor = template.defaultAccent
  markHomeDirty()
}

function setAccent(color) {
  homeDraft.value.accentColor = color
  markHomeDirty()
}

function blockTypeName(type) {
  return {
    notice: '门店公告',
    featured: '招牌推荐',
    story: '品牌故事',
    storeInfo: '到店信息',
  }[type] || '内容区块'
}

function moveBlock(index, offset) {
  const target = index + offset
  if (target < 0 || target >= homeDraft.value.blocks.length) {
    return
  }
  const blocks = [...homeDraft.value.blocks]
  ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
  homeDraft.value.blocks = blocks
  markHomeDirty()
}

function toggleBlock(block, event) {
  block.visible = event.detail.value
  markHomeDirty()
}

function toggleFeaturedDish(dishId) {
  const selected = homeDraft.value.featuredDishIds
  if (selected.includes(dishId)) {
    homeDraft.value.featuredDishIds = selected.filter((id) => id !== dishId)
    markHomeDirty()
    return
  }
  if (selected.length >= 4) {
    uni.showToast({ title: '最多选择 4 个招牌菜', icon: 'none' })
    return
  }
  homeDraft.value.featuredDishIds = [...selected, dishId]
  markHomeDirty()
}

function categoryName(categoryId) {
  return draft.value.categories.find((item) => item.id === categoryId)?.name || ''
}

function formatDate(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function chooseCover() {
  try {
    storeForm.value.cover = await choosePersistentImage()
    markStoreDirty()
  } catch (error) {
    if (!String(error.errMsg || error.message || '').includes('cancel')) {
      uni.showToast({ title: '图片保存失败', icon: 'none' })
    }
  }
}

function clearCover() {
  storeForm.value.cover = ''
  markStoreDirty()
}

function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  draft.value.categories.push({
    id: createId('category'),
    name,
    sortOrder: draft.value.categories.length + 1,
  })
  newCategoryName.value = ''
  markMenuDirty()
}

function deleteCategory(category) {
  const dishCount = draft.value.dishes.filter((item) => item.categoryId === category.id).length
  uni.showModal({
    title: '删除分类',
    content: dishCount ? `该分类下有 ${dishCount} 个菜品，会一并从草稿中删除。` : '确认删除这个分类？',
    confirmColor: '#B85C38',
    success: (result) => {
      if (!result.confirm) {
        return
      }
      draft.value.categories = draft.value.categories
        .filter((item) => item.id !== category.id)
        .map((item, index) => ({ ...item, sortOrder: index + 1 }))
      draft.value.dishes = draft.value.dishes.filter((item) => item.categoryId !== category.id)
      markMenuDirty()
    },
  })
}

function openDishEditor(dish) {
  editingDishId.value = dish?.id || ''
  const source = dish || {
    id: createId('dish'),
    categoryId: draft.value.categories[0]?.id || '',
    name: '',
    image: '',
    priceInCents: 0,
    description: '',
    specs: [],
  }
  dishForm.value = {
    ...clone(source),
    priceYuan: centsToYuanInput(source.priceInCents),
    specs: (source.specs || []).map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        priceDeltaYuan: centsToYuanInput(option.priceDeltaInCents),
      })),
    })),
  }
}

function closeDishEditor() {
  dishForm.value = null
  editingDishId.value = ''
}

async function chooseDishImage() {
  try {
    dishForm.value.image = await choosePersistentImage()
  } catch (error) {
    if (!String(error.errMsg || error.message || '').includes('cancel')) {
      uni.showToast({ title: '图片保存失败', icon: 'none' })
    }
  }
}

function changeDishCategory(event) {
  const category = draft.value.categories[Number(event.detail.value)]
  if (category) {
    dishForm.value.categoryId = category.id
  }
}

function addSpecGroup() {
  dishForm.value.specs.push({
    id: createId('spec'),
    name: '',
    required: true,
    options: [
      {
        id: createId('option'),
        name: '',
        priceDeltaYuan: '0',
      },
    ],
  })
}

function removeSpecGroup(index) {
  dishForm.value.specs.splice(index, 1)
}

function addSpecOption(groupIndex) {
  dishForm.value.specs[groupIndex].options.push({
    id: createId('option'),
    name: '',
    priceDeltaYuan: '0',
  })
}

function removeSpecOption(groupIndex, optionIndex) {
  dishForm.value.specs[groupIndex].options.splice(optionIndex, 1)
}

function saveDish() {
  const name = dishForm.value.name.trim()
  const priceInCents = parseYuanToCents(dishForm.value.priceYuan)
  if (!name) {
    uni.showToast({ title: '菜品名称不能为空', icon: 'none' })
    return
  }
  if (!dishForm.value.categoryId) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }
  if (priceInCents === null) {
    uni.showToast({ title: '请输入有效价格，最多两位小数', icon: 'none' })
    return
  }

  const specs = []
  for (const group of dishForm.value.specs) {
    if (!group.name.trim() || !group.options.length) {
      uni.showToast({ title: '规格组名称和选项不能为空', icon: 'none' })
      return
    }
    const options = []
    for (const option of group.options) {
      const priceDeltaInCents = parseYuanToCents(option.priceDeltaYuan)
      if (!option.name.trim() || priceDeltaInCents === null) {
        uni.showToast({ title: '规格选项或加价无效', icon: 'none' })
        return
      }
      options.push({
        id: option.id,
        name: option.name.trim(),
        priceDeltaInCents,
      })
    }
    specs.push({
      id: group.id,
      name: group.name.trim(),
      required: Boolean(group.required),
      options,
    })
  }

  const saved = {
    id: dishForm.value.id,
    categoryId: dishForm.value.categoryId,
    name,
    image: dishForm.value.image || '',
    priceInCents,
    description: dishForm.value.description.trim(),
    specs,
  }
  const index = draft.value.dishes.findIndex((item) => item.id === saved.id)
  if (index >= 0) {
    draft.value.dishes[index] = saved
  } else {
    draft.value.dishes.push(saved)
  }
  closeDishEditor()
  markMenuDirty()
}

function deleteDish(dish) {
  uni.showModal({
    title: '删除菜品',
    content: `确认从草稿中删除“${dish.name}”？`,
    confirmColor: '#B85C38',
    success: (result) => {
      if (result.confirm) {
        draft.value.dishes = draft.value.dishes.filter((item) => item.id !== dish.id)
        markMenuDirty()
      }
    },
  })
}

async function saveStoreOnly(showToast = true) {
  savingStore.value = true
  try {
    const savedStore = await saveStore(storeForm.value)
    storeForm.value = savedStore
    storeDirty.value = false
    if (showToast) {
      uni.showToast({ title: '店铺资料已保存', icon: 'success' })
    }
    return true
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
    return false
  } finally {
    savingStore.value = false
  }
}

async function saveDraftOnly(showToast = true) {
  savingDraft.value = true
  try {
    draft.value = await saveDraftMenu(draft.value)
    menuDirty.value = false
    if (showToast) {
      uni.showToast({ title: '草稿已保存', icon: 'success' })
    }
    return true
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
    return false
  } finally {
    savingDraft.value = false
  }
}

async function saveHomepageDraft(showToast = true) {
  savingHome.value = true
  try {
    homeDraft.value = await saveDraftStorefront(homeDraft.value)
    homeDirty.value = false
    if (showToast) {
      uni.showToast({ title: '主页草稿已保存', icon: 'success' })
    }
    return true
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
    return false
  } finally {
    savingHome.value = false
  }
}

async function publishHomepage() {
  publishingHome.value = true
  try {
    if (storeDirty.value && !(await saveStoreOnly(false))) {
      return
    }
    if (!(await saveHomepageDraft(false))) {
      return
    }
    publishedHome.value = await publishStorefront(STORE_ID)
    homeDraft.value = await getDraftStorefront(STORE_ID)
    homeDirty.value = false
    uni.showToast({ title: '门店主页已发布', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '发布失败', icon: 'none' })
  } finally {
    publishingHome.value = false
  }
}

async function publish() {
  publishing.value = true
  try {
    if (storeDirty.value && !(await saveStoreOnly(false))) {
      return
    }
    if (!(await saveDraftOnly(false))) {
      return
    }
    published.value = await publishMenu(STORE_ID)
    draft.value = await getDraftMenu(STORE_ID)
    menuDirty.value = false
    uni.showToast({ title: '菜单已发布', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '发布失败', icon: 'none' })
  } finally {
    publishing.value = false
  }
}

function previewStorefront() {
  uni.navigateTo({ url: `/pages/customer/storefront?storeId=${STORE_ID}` })
}
</script>

<style scoped>
.merchant-page {
  padding-bottom: 60rpx;
}

.status-card {
  display: flex;
  padding: 30rpx;
  align-items: center;
  justify-content: space-between;
  border-radius: 18rpx;
  background: #171717;
  color: #fff;
}

.status-group {
  display: flex;
  gap: 42rpx;
}

.status-label,
.status-time {
  display: block;
  color: #aaa39a;
  font-size: 22rpx;
}

.status-value {
  display: block;
  margin: 8rpx 0;
  color: #f5b000;
  font-size: 36rpx;
  font-weight: 800;
}

.status-value.published {
  color: #63bd8b;
}

.preview-button {
  padding: 17rpx 22rpx;
  background: #f5b000;
  font-weight: 700;
}

.section {
  margin-top: 24rpx;
  padding: 28rpx;
}

.section-heading {
  display: flex;
  margin-bottom: 26rpx;
  align-items: center;
  justify-content: space-between;
}

.section-index {
  margin-right: 15rpx;
  color: #a1781f;
  font-size: 20rpx;
  font-weight: 700;
}

.section-title {
  font-size: 34rpx;
  font-weight: 800;
}

.section-count {
  color: #746f67;
  font-size: 23rpx;
}

.builder-help {
  display: block;
  color: #7a7268;
  font-size: 22rpx;
  line-height: 1.6;
}

.template-scroll {
  display: flex;
  width: 100%;
  white-space: nowrap;
}

.template-option {
  display: inline-flex;
  width: 260rpx;
  min-height: 190rpx;
  margin-right: 16rpx;
  padding: 18rpx;
  border: 2rpx solid #e3d9ca;
  border-radius: 16rpx;
  vertical-align: top;
  flex-direction: column;
  white-space: normal;
}

.template-option.active {
  border-color: #171717;
  box-shadow: inset 0 0 0 2rpx #171717;
}

.template-swatch {
  width: 100%;
  height: 58rpx;
  border-radius: 9rpx;
}

.template-name {
  margin-top: 14rpx;
  font-weight: 800;
}

.template-description {
  margin-top: 7rpx;
  color: #7a7268;
  font-size: 20rpx;
  line-height: 1.45;
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.color-option {
  width: 58rpx;
  height: 58rpx;
  border: 7rpx solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1rpx #d6cabb;
}

.color-option.active {
  box-shadow: 0 0 0 5rpx #171717;
}

.field-textarea.short {
  height: 110rpx;
  min-height: 110rpx;
}

.block-builder-heading {
  margin-top: 30rpx;
}

.builder-block {
  margin-top: 16rpx;
  padding: 20rpx;
  border: 1rpx solid #e1d7c8;
  border-radius: 14rpx;
  background: #fbf8f2;
}

.builder-block-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.builder-block-type,
.builder-block-order {
  display: block;
}

.builder-block-type {
  font-weight: 800;
}

.builder-block-order {
  margin-top: 4rpx;
  color: #8a8278;
  font-size: 20rpx;
}

.block-actions {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.block-actions button {
  padding: 11rpx 13rpx;
  background: #eee8de;
  font-size: 21rpx;
}

.block-actions switch {
  transform: scale(0.72);
}

.field-input.compact {
  height: 66rpx;
  margin-top: 16rpx;
  line-height: 66rpx;
}

.featured-picker {
  margin-top: 26rpx;
}

.featured-options {
  display: flex;
  margin-top: 14rpx;
  flex-wrap: wrap;
  gap: 12rpx;
}

.featured-option {
  padding: 14rpx 18rpx;
  border: 1rpx solid #ddd3c3;
  border-radius: 999rpx;
  background: #fff;
  color: #625d55;
  font-size: 22rpx;
}

.featured-option.active {
  border-color: #171717;
  background: #171717;
  color: #fff;
}

.homepage-actions {
  display: grid;
  margin-top: 30rpx;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
}

.homepage-actions button {
  padding: 22rpx 12rpx;
}

.cover-row,
.dish-image-row {
  display: flex;
  margin-bottom: 26rpx;
  align-items: flex-end;
  gap: 18rpx;
}

.cover-preview,
.cover-preview image {
  width: 220rpx;
  height: 130rpx;
  border-radius: 14rpx;
}

.cover-preview,
.dish-image-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee7da;
  color: #8d806d;
  font-size: 23rpx;
}

.field-label {
  display: block;
  margin: 22rpx 0 10rpx;
  color: #625d55;
  font-size: 24rpx;
  font-weight: 700;
}

.field-input,
.inline-input,
.picker-field,
.field-textarea,
.option-name,
.option-price {
  border: 1rpx solid #ddd3c3;
  border-radius: 12rpx;
  background: #fff;
}

.field-input,
.picker-field {
  height: 78rpx;
  padding: 0 22rpx;
  line-height: 78rpx;
}

.field-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 18rpx 22rpx;
}

.category-row,
.add-row,
.dish-row,
.spec-top,
.option-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.category-row,
.add-row {
  margin-top: 16rpx;
}

.inline-input {
  height: 68rpx;
  padding: 0 18rpx;
  flex: 1;
}

.small-primary,
.small-button {
  padding: 15rpx 20rpx;
  background: #f5b000;
  font-weight: 700;
}

.store-save-button {
  margin: 24rpx 0 0;
  padding: 16rpx 24rpx;
  color: #171717;
  background: #f5b000;
  font-weight: 700;
}

.delete-text {
  padding: 13rpx 16rpx;
  color: #b85c38;
  background: #f8eee9;
}

.dish-row {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee8de;
}

.dish-thumb,
.dish-thumb image {
  width: 104rpx;
  height: 104rpx;
  border-radius: 12rpx;
}

.dish-thumb {
  display: flex;
  flex: 0 0 104rpx;
  align-items: center;
  justify-content: center;
  background: #eee7da;
  color: #a79372;
  font-size: 38rpx;
  font-weight: 700;
}

.dish-copy {
  min-width: 0;
  flex: 1;
}

.dish-name,
.dish-meta {
  display: block;
}

.dish-name {
  font-weight: 700;
}

.dish-meta {
  margin-top: 6rpx;
  color: #746f67;
  font-size: 22rpx;
}

.dish-actions {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.dish-actions button {
  padding: 11rpx 16rpx;
  background: #f2eee6;
}

.action-bar {
  display: grid;
  margin-top: 24rpx;
  padding: 18rpx;
  grid-template-columns: 1fr 1.4fr;
  gap: 16rpx;
  border: 1rpx solid #e8e1d5;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.96);
}

.action-bar button {
  padding: 24rpx;
}

.editor-overlay {
  position: fixed;
  z-index: 100;
  right: 0;
  bottom: 0;
  left: 0;
  top: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.48);
}

.editor-sheet {
  width: 100%;
  max-height: 90vh;
  padding: 30rpx;
  border-radius: 26rpx 26rpx 0 0;
  background: #faf7f0;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-title {
  font-size: 36rpx;
  font-weight: 800;
}

.dish-image-editor,
.dish-image-editor image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 14rpx;
}

.spec-heading {
  display: flex;
  margin-top: 18rpx;
  align-items: center;
  justify-content: space-between;
}

.spec-card {
  margin-top: 18rpx;
  padding: 20rpx;
  border: 1rpx solid #e1d7c8;
  border-radius: 14rpx;
  background: #fff;
}

.required-control {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #746f67;
  font-size: 22rpx;
}

.required-control switch {
  transform: scale(0.75);
}

.option-row {
  margin-top: 14rpx;
}

.option-name,
.option-price {
  height: 64rpx;
  padding: 0 15rpx;
}

.option-name {
  flex: 1;
}

.option-price {
  width: 140rpx;
}

.add-option {
  margin-top: 16rpx;
  padding: 13rpx 18rpx;
  background: #f2eee6;
}

.save-dish {
  margin: 32rpx 0 70rpx;
  padding: 25rpx;
}
</style>
