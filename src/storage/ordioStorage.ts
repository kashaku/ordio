import { seedData } from '../mock/seedData';
import type { OrdioData } from '../types/domain';

const STORAGE_KEY = 'ordio.local-data.v1';

function cloneData(data: OrdioData): OrdioData {
  return structuredClone(data);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOrdioData(value: unknown): value is OrdioData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.stores) &&
    Array.isArray(value.menus) &&
    Array.isArray(value.templates) &&
    Array.isArray(value.orders) &&
    Array.isArray(value.comments)
  );
}

export function readOrdioData(): OrdioData {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return cloneData(seedData);
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isOrdioData(parsed) ? parsed : cloneData(seedData);
  } catch {
    return cloneData(seedData);
  }
}

export function writeOrdioData(data: OrdioData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function initializeOrdioData(): OrdioData {
  const existing = readOrdioData();
  writeOrdioData(existing);
  return existing;
}

export function resetOrdioData(): OrdioData {
  const nextData = cloneData(seedData);
  writeOrdioData(nextData);
  return nextData;
}
