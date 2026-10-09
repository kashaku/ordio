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

          <div class="builder-actions">
            <button class="secondary-action" type="button" @click="resetDraft">恢复初始配置</button>
            <button class="primary-action" type="button" @click="saveDraft">保存开发草稿</button>
          </div>
          <p v-if="savedMessage" class="saved-message">{{ savedMessage }}</p>
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
            <section class="preview-section">
              <small>本店招牌</small>
              <div class="dish-row"><span /><span /><span /></div>
            </section>
            <section class="preview-section muted-preview">
              <small>关于我们</small>
              <p>用当季食材和熟悉的味道，认真做好每一餐。</p>
            </section>
          </div>
        </aside>
      </div>
    </div>
  </AdminShell>
</template>

<script setup>
import { reactive, ref } from 'vue'

import AdminShell from '../components/AdminShell.vue'

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
}

const draft = reactive(readDraft())
const savedMessage = ref('')

function selectTemplate(template) {
  draft.templateId = template.id
  draft.accentColor = template.defaultAccent
}

function saveDraft() {
  localStorage.setItem(storageKey, JSON.stringify(draft))
  savedMessage.value = '草稿已保存在当前浏览器，仅用于管理端迁移开发。'
}

function resetDraft() {
  Object.assign(draft, structuredClone(defaultDraft))
  localStorage.removeItem(storageKey)
  savedMessage.value = ''
}

function readDraft() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey))
    return stored?.hero ? stored : structuredClone(defaultDraft)
  } catch {
    return structuredClone(defaultDraft)
  }
}
</script>
