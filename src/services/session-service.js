import { callCloud, isCloudConfigured } from './cloud-client'

let currentSession = null

export async function initializeCloudSession() {
  if (!isCloudConfigured()) {
    return null
  }
  currentSession = await callCloud('session.get')
  return currentSession
}

export function getCurrentSession() {
  return currentSession
}

export async function resolveCloudTable(tableToken) {
  return callCloud('entry.resolveTable', { tableToken })
}
