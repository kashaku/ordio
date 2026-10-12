<template>
  <AdminShell>
    <div class="content-page builder-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">STOREFRONT BUILDER</p>
          <h1>主页搭建</h1>
          <p>从适配好的模板开始配置，不需要从空白画布设计。</p>
        </div>
        <span class="draft-state">开发预览草稿</span>
      </div>

      <div class="builder-layout">
        <section class="builder-controls">
          <div class="control-section">
            <h2>选择模板</h2>
            <div class="template-grid">
              <button
                v-for="template in templates"
                :key="template.id"
                type="button"
                class="template-card"
                :class="{ selected: draft.templateId === template.id }"
                @click="selectTemplate(template)"
              >
                <span class="template-color" :style="{ background: template.defaultAccent }" />
                <strong>{{ template.name }}</strong>
                <small>{{ template.description }}</small>
              </button>
            </div>
          </div>

          <div class="control-section">
            <h2>品牌与首屏</h2>
            <label>品牌色</label>
            <div class="color-list">
              <button
                v-for="color in accentColors"
                :key="color"
                type="button"
                :aria-label="`选择颜色 ${color}`"
                :class="{ selected: draft.accentColor === color }"
                :style="{ background: color }"
                @click="draft.accentColor = color"
              />
            </div>
            <label for="eyebrow">首屏短标</label>
            <input id="eyebrow" v-model="draft.hero.eyebrow" maxlength="20" />
            <label for="title">主页标题</label>
            <input id="title" v-model="draft.hero.title" maxlength="32" />
            <label for="subtitle">副标题</label>
            <textarea id="subtitle" v-model="draft.hero.subtitle" maxlength="80" rows="3" />
            <label for="button-text">按钮文案</label>
            <input id="button-text" v-model="draft.hero.buttonText" maxlength="12" />
          </div>

          <div class="control-section">
            <div class="section-title-row">
              <h2>内容区块</h2>
              <small>顾客端按这里的顺序展示</small>
            </div>
            <article v-for="(block, index) in draft.blocks" :key="block.id" class="block-editor">
              <div class="block-heading">
                <label class="visibility-toggle">
                  <input v-model="block.visible" type="checkbox" />
                  <span>{{ block.visible ? '显示' : '隐藏' }}</span>
                </label>
                <div class="block-order-actions">
                  <button type="button" :disabled="index === 0" @click="moveBlock(index, -1)">上移</button>
                  <button type="button" :disabled="index === draft.blocks.length - 1" @click="moveBlock(index, 1)">下移</button>
                </div>
              </div>
              <label :for="`${block.id}-title`">区块标题</label>
              <input :id="`${block.id}-title`" v-model="block.title" maxlength="30" />
              <template v-if="block.type !== 'featured' && block.type !== 'storeInfo'">
                <label :for="`${block.id}-content`">区块文案</label>
                <textarea :id="`${block.id}-content`" v-model="block.content" maxlength="500" rows="3" />
              </template>
              <p v-else class="block-source-hint">
                {{ block.type === 'featured' ? '招牌菜将从当前门店已发布菜单中选择。' : '地址和营业时间自动读取门店资料。' }}
              </p>
            </article>
          </div>

          <div class="builder-actions">
            <button class="secondary-action" type="button" @click="resetDraft">恢复初始配置</button>
            <button class="primary-action" type="button" :disabled="saving" @click="saveDraft">
              {{ saving ? '正在保存…' : '保存草稿' }}
            </button>
            <button
              class="publish-action"
              type="button"
              :disabled="!merchantApiConfigured || publishing || revision === 0"
              @click="publishDraft"
            >
              {{ publishing ? '正在发布…' : '发布给顾客' }}
            </button>
          </div>
          <p v-if="savedMessage" class="saved-message">{{ savedMessage }}</p>
          <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
        </section>

        <aside class="phone-preview-wrap">
          <p>顾客端预览</p>
          <div class="phone-preview" :class="`template-${draft.templateId}`">
            <div class="phone-bar"><span>9:41</span><span>ORDIO</span></div>
            <section class="preview-hero" :style="{ '--accent': draft.accentColor }">
              <small>{{ draft.hero.eyebrow }}</small>
              <h2>{{ draft.hero.title }}</h2>
              <p>{{ draft.hero.subtitle }}</p>
              <button type="button" :style="{ background: draft.accentColor }">{{ draft.hero.buttonText }}</button>
            </section>
            <section
              v-for="block in visibleBlocks"
              :key="block.id"
              class="preview-section"
              :class="{ 'muted-preview': block.type === 'story' || block.type === 'notice' }"
            >
              <small>{{ block.title }}</small>
              <div v-if="block.type === 'featured'" class="dish-row"><span /><span /><span /></div>
              <p v-else-if="block.type === 'storeInfo'">{{ currentStore?.storeName || '当前门店' }} · 营业信息</p>
              <p v-else>{{ block.content }}</p>
            </section>
          </div>
        </aside>
      </div>
    </div>
  </AdminShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import AdminShell from '../components/AdminShell.vue'
import { merchantApiConfigured, merchantSession } from '../services/merchant-session'
import {
  getStorefrontDraft,
  publishStorefront,
  saveStorefrontDraft,
} from '../services/storefront-service'

const storageKey = 'ordio:merchant-admin:storefront-draft'
const templates = [
  { id: 'warm', name: '暖意食堂', description: '家常菜、简餐和社区餐厅', defaultAccent: '#b85c38' },
  { id: 'fresh', name: '清新自然', description: '轻食、茶饮和健康餐', defaultAccent: '#2f7d57' },
  { id: 'bold', name: '醒目招牌', description: '快餐、小吃和夜宵门店', defaultAccent: '#e08a16' },
]
const accentColors = ['#b85c38', '#2f7d57', '#e08a16', '#8d6a22', '#3c5a7d', '#7a4b78']
const defaultDraft = {
  templateId: 'warm',
  accentColor: '#b85c38',
  hero: {
    eyebrow: '今日好味',
    title: '认真做一顿热乎饭',
    subtitle: '现点现做，欢迎入座。',
    buttonText: '开始点餐',
  },
  blocks: [
    { id: 'block-notice', type: 'notice', visible: true, title: '门店公告', content: '高峰时段请耐心等候，感谢理解。' },
    { id: 'block-featured', type: 'featured', visible: true, title: '本店招牌', content: '' },
    { id: 'block-story', type: 'story', visible: true, title: '关于我们', content: '用当季食材和熟悉的味道，认真做好每一餐。' },
    { id: 'block-store-info', type: 'storeInfo', visible: true, title: '到店信息', content: '' },
  ],
  featuredDishIds: [],
}

const draft = reactive(readDraft())
const savedMessage = ref('')
const errorMessage = ref('')
const revision = ref(0)
const saving = ref(false)
const publishing = ref(false)
const currentStore = computed(() => merchantSession.memberships[0] || null)
const visibleBlocks = computed(() => draft.blocks.filter((block) => block.visible))

onMounted(loadDraft)

function selectTemplate(template) {
  draft.templateId = template.id
  draft.accentColor = template.defaultAccent
}

function moveBlock(index, offset) {
  const nextIndex = index + offset
  if (nextIndex < 0 || nextIndex >= draft.blocks.length) {
    return
  }
  const blocks = [...draft.blocks]
  const [block] = blocks.splice(index, 1)
  blocks.splice(nextIndex, 0, block)
  draft.blocks = blocks
}

async function loadDraft() {
  if (!merchantApiConfigured || !currentStore.value) {
    return
  }
  errorMessage.value = ''
  try {
    const result = await getStorefrontDraft(currentStore.value.storeId)
    if (result?.config) {
      Object.assign(draft, structuredClone(result.config))
      revision.value = result.revision
    }
  } catch (error) {
    errorMessage.value = error.message || '主页草稿读取失败'
  }
}

async function saveDraft() {
  saving.value = true
  savedMessage.value = ''
  errorMessage.value = ''
  try {
    if (!merchantApiConfigured) {
      localStorage.setItem(storageKey, JSON.stringify(draft))
      savedMessage.value = '草稿已保存在当前浏览器，仅用于管理端迁移开发。'
      return
    }
    const result = await saveStorefrontDraft(currentStore.value.storeId, structuredClone(draft), revision.value)
    revision.value = result.revision
    savedMessage.value = `草稿已保存，版本 ${result.revision}`
  } catch (error) {
    errorMessage.value = error.message || '主页草稿保存失败'
  } finally {
    saving.value = false
  }
}

async function publishDraft() {
  publishing.value = true
  savedMessage.value = ''
  errorMessage.value = ''
  try {
    const result = await publishStorefront(currentStore.value.storeId, revision.value)
    savedMessage.value = `主页版本 ${result.version} 已发布`
  } catch (error) {
    errorMessage.value = error.message || '主页发布失败'
  } finally {
    publishing.value = false
  }
}

function resetDraft() {
  Object.assign(draft, structuredClone(defaultDraft))
  revision.value = 0
  localStorage.removeItem(storageKey)
  savedMessage.value = ''
}

function readDraft() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey))
    if (!stored?.hero) {
      return structuredClone(defaultDraft)
    }
    return {
      ...structuredClone(defaultDraft),
      ...stored,
      hero: { ...defaultDraft.hero, ...stored.hero },
      blocks: Array.isArray(stored.blocks) ? stored.blocks : structuredClone(defaultDraft.blocks),
      featuredDishIds: Array.isArray(stored.featuredDishIds) ? stored.featuredDishIds : [],
    }
  } catch {
    return structuredClone(defaultDraft)
  }
}
</script>
