import { localRepository } from './local-repository'

export const repositoryMethods = Object.freeze([
  'initialize',
  'getStore',
  'saveStore',
  'listTables',
  'resolveTableToken',
  'createTable',
  'rotateTableToken',
  'setTableEnabled',
  'getDraftMenu',
  'saveDraftMenu',
  'publishMenu',
  'getPublishedMenu',
  'getDraftStorefront',
  'saveDraftStorefront',
  'publishStorefront',
  'getPublishedStorefront',
  'getCart',
  'saveCart',
  'saveOrder',
  'getOrder',
  'listOrders',
  'payOrder',
  'resetDemoData',
])

let activeRepository = localRepository

export function useRepository(repository) {
  const missingMethod = repositoryMethods.find((name) => typeof repository?.[name] !== 'function')
  if (missingMethod) {
    throw new Error(`Repository 缺少方法：${missingMethod}`)
  }
  activeRepository = repository
}

export const initializeRepository = (...args) => activeRepository.initialize(...args)
export const getStore = (...args) => activeRepository.getStore(...args)
export const saveStore = (...args) => activeRepository.saveStore(...args)
export const listTables = (...args) => activeRepository.listTables(...args)
export const resolveTableToken = (...args) => activeRepository.resolveTableToken(...args)
export const createTable = (...args) => activeRepository.createTable(...args)
export const rotateTableToken = (...args) => activeRepository.rotateTableToken(...args)
export const setTableEnabled = (...args) => activeRepository.setTableEnabled(...args)
export const getDraftMenu = (...args) => activeRepository.getDraftMenu(...args)
export const saveDraftMenu = (...args) => activeRepository.saveDraftMenu(...args)
export const publishMenu = (...args) => activeRepository.publishMenu(...args)
export const getPublishedMenu = (...args) => activeRepository.getPublishedMenu(...args)
export const getDraftStorefront = (...args) => activeRepository.getDraftStorefront(...args)
export const saveDraftStorefront = (...args) => activeRepository.saveDraftStorefront(...args)
export const publishStorefront = (...args) => activeRepository.publishStorefront(...args)
export const getPublishedStorefront = (...args) => activeRepository.getPublishedStorefront(...args)
export const getCart = (...args) => activeRepository.getCart(...args)
export const saveCart = (...args) => activeRepository.saveCart(...args)
export const saveOrder = (...args) => activeRepository.saveOrder(...args)
export const getOrder = (...args) => activeRepository.getOrder(...args)
export const listOrders = (...args) => activeRepository.listOrders(...args)
export const payOrder = (...args) => activeRepository.payOrder(...args)
export const resetDemoData = (...args) => activeRepository.resetDemoData(...args)
