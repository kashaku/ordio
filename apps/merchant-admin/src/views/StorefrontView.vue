<template>
  <AdminShell>
    <div class="content-page builder-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">STOREFRONT BUILDER</p>
          <h1>主页搭建</h1>
          <p>从适配好的模板开始配置，不需要从空白画布设计。</p>
        </div>
        <span class="draft-state">{{ merchantApiConfigured ? (dirty ? '有未保存修改' : '云端草稿') : '浏览器预览' }}</span>
      </div>

      <p v-if="loading">正在读取主页草稿…</p>
      <p v-if="!loading && !ready" class="form-error">
        {{ errorMessage }}
        <button type="button" @click="loadDraft">重新读取</button>
      </p>
      <div class="builder-layout">
        <fieldset class="builder-controls" :disabled="loading || !ready || saving || publishing">
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
                :class="{ selected: draft.accentColor.toLowerCase() === color.toLowerCase() }"
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
                {{ block.type === 'featured' ? '招牌菜选择暂未开放，已有菜品配置会保留。' : '地址和营业时间自动读取门店资料。' }}
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
              :disabled="!merchantApiConfigured || publishing || saving || dirty || revision === 0"
              @click="publishDraft"
            >
              {{ publishing ? '正在发布…' : '发布给顾客' }}
            </button>
          </div>
          <p v-if="merchantApiConfigured && dirty" class="block-source-hint">修改尚未保存，保存后才能发布。</p>
          <p v-if="savedMessage" class="saved-message">{{ savedMessage }}</p>
          <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
        </fieldset>

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
              <p v-if="block.type === 'featured'">菜品信息暂不支持在此预览</p>
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

import {
  createDefaultStorefrontConfig,
  storefrontTemplates as templates,
  storefrontAccentColors as accentColors,
} from '../../../../src/data/storefront-templates'
import AdminShell from '../components/AdminShell.vue'
import { merchantApiConfigured, merchantSession } from '../services/merchant-session'
import {
  getStorefrontDraft,
  publishStorefront,
  saveStorefrontDraft,
} from '../services/storefront-service'

const storageKey = 'ordio:merchant-admin:storefront-draft'
const defaultDraft = createDefaultStorefrontConfig()
const draft = reactive(merchantApiConfigured ? structuredClone(defaultDraft) : readDraft())
const savedSnapshot = ref(JSON.stringify(draft))
const dirty = computed(() => JSON.stringify(draft) !== savedSnapshot.value)
const loading = ref(merchantApiConfigured)
const ready = ref(!merchantApiConfigured)
const savedMessage = ref('')
const errorMessage = ref('')
const revision = ref(0)
const saving = ref(false)
const publishing = ref(false)
const currentStore = computed(() => merchantSession.memberships[0] || null)
const visibleBlocks = computed(() => draft.blocks.filter((block) => block.visible && (block.type !== 'featured' || draft.featuredDishIds.length)))

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
  if (!merchantApiConfigured) {
    return
  }
  loading.value = true
  ready.value = false
  errorMessage.value = ''
  try {
    if (!currentStore.value) {
      throw new Error('当前账号没有可管理的门店')
    }
    const result = await getStorefrontDraft(currentStore.value.storeId)
    Object.assign(draft, structuredClone(result?.config || defaultDraft))
    revision.value = result?.revision || 0
    savedSnapshot.value = JSON.stringify(draft)
    ready.value = true
  } catch (error) {
    errorMessage.value = error.message || '主页草稿读取失败'
  } finally {
    loading.value = false
  }
}

async function saveDraft() {
  if (!ready.value || saving.value || publishing.value) {
    return
  }
  saving.value = true
  savedMessage.value = ''
  errorMessage.value = ''
  const snapshot = JSON.stringify(draft)
  try {
    if (!merchantApiConfigured) {
      localStorage.setItem(storageKey, snapshot)
      savedSnapshot.value = snapshot
      savedMessage.value = '草稿已保存在当前浏览器，未同步到顾客小程序。'
      return
    }
    const result = await saveStorefrontDraft(currentStore.value.storeId, JSON.parse(snapshot), revision.value)
    revision.value = result.revision
    savedSnapshot.value = snapshot
    savedMessage.value = `草稿已保存，版本 ${result.revision}`
  } catch (error) {
    errorMessage.value = error.message || '主页草稿保存失败'
  } finally {
    saving.value = false
  }
}

async function publishDraft() {
  if (!merchantApiConfigured || !ready.value || dirty.value || !revision.value || saving.value || publishing.value) {
    return
  }
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
  savedMessage.value = '已恢复初始配置，保存后生效。'
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

<style scoped>
fieldset.builder-controls {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
</style>

