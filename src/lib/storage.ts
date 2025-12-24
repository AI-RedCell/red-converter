// IndexedDB utilities for Red Converter

const DB_NAME = 'RedConverterDB';
const DB_VERSION = 1;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  pipeline: string[];
  favorite: boolean;
}

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // History store
      if (!database.objectStoreNames.contains('history')) {
        const historyStore = database.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('favorite', 'favorite', { unique: false });
      }

      // Favorites store
      if (!database.objectStoreNames.contains('favorites')) {
        database.createObjectStore('favorites', { keyPath: 'id' });
      }
    };
  });
}

export async function addToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<string> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    const id = crypto.randomUUID();
    const fullEntry: HistoryEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
    };
    
    const request = store.add(fullEntry);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readonly');
    const store = transaction.objectStore('history');
    const index = store.index('timestamp');
    
    const entries: HistoryEntry[] = [];
    const request = index.openCursor(null, 'prev');
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor && entries.length < limit) {
        entries.push(cursor.value);
        cursor.continue();
      } else {
        resolve(entries);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const entry = getRequest.result as HistoryEntry;
      if (entry) {
        entry.favorite = !entry.favorite;
        const updateRequest = store.put(entry);
        updateRequest.onsuccess = () => resolve(entry.favorite);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Entry not found'));
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearHistory(): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFavorites(): Promise<HistoryEntry[]> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readonly');
    const store = transaction.objectStore('history');
    const index = store.index('favorite');
    
    const request = index.getAll(IDBKeyRange.only(true));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== #64 - HISTORY SEARCH =====
export async function searchHistory(query: string): Promise<HistoryEntry[]> {
  const history = await getHistory(1000); // Get all
  const lowerQuery = query.toLowerCase();
  
  return history.filter(entry => 
    entry.input.toLowerCase().includes(lowerQuery) ||
    entry.output.toLowerCase().includes(lowerQuery) ||
    entry.pipeline.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

// ===== #65 - EXPORT HISTORY =====
export async function exportHistoryJSON(): Promise<string> {
  const history = await getHistory(1000);
  return JSON.stringify(history, null, 2);
}

export async function downloadHistoryAsJSON(): Promise<void> {
  const data = await exportHistoryJSON();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `red-converter-history-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== #68 - SETTINGS STORAGE =====
export interface AppSettings {
  theme: 'dark' | 'light';
  autoExecute: boolean;
  autoSaveInput: boolean;
  showWarnings: boolean;
  maxHistoryItems: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoExecute: false,
  autoSaveInput: true,
  showWarnings: true,
  maxHistoryItems: 100,
};

const SETTINGS_KEY = 'red-converter-settings';

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

// ===== #69 - AUTO-SAVE INPUT =====
const LAST_INPUT_KEY = 'red-converter-last-input';

export function saveLastInput(input: string): void {
  if (getSettings().autoSaveInput) {
    localStorage.setItem(LAST_INPUT_KEY, input);
  }
}

export function getLastInput(): string {
  return localStorage.getItem(LAST_INPUT_KEY) || '';
}

// ===== #70 - PIPELINE TEMPLATES =====
export interface SavedPipeline {
  id: string;
  name: string;
  description: string;
  steps: { transformationId: string; mode: 'encode' | 'decode' }[];
  createdAt: number;
}

const PIPELINES_KEY = 'red-converter-pipelines';

export function getSavedPipelines(): SavedPipeline[] {
  try {
    const stored = localStorage.getItem(PIPELINES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function savePipeline(name: string, description: string, steps: SavedPipeline['steps']): SavedPipeline {
  const pipelines = getSavedPipelines();
  const newPipeline: SavedPipeline = {
    id: crypto.randomUUID(),
    name,
    description,
    steps,
    createdAt: Date.now(),
  };
  pipelines.push(newPipeline);
  localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines));
  return newPipeline;
}

export function deleteSavedPipeline(id: string): void {
  const pipelines = getSavedPipelines().filter(p => p.id !== id);
  localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines));
}

export function loadPipelineById(id: string): SavedPipeline | null {
  return getSavedPipelines().find(p => p.id === id) || null;
}

// ===== LAST PIPELINE STATE =====
const LAST_PIPELINE_KEY = 'red-converter-last-pipeline';

export function saveLastPipeline(steps: SavedPipeline['steps']): void {
  localStorage.setItem(LAST_PIPELINE_KEY, JSON.stringify(steps));
}

export function getLastPipeline(): SavedPipeline['steps'] {
  try {
    const stored = localStorage.getItem(LAST_PIPELINE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ===== CLEAR ALL DATA =====
export function clearAllData(): void {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(LAST_INPUT_KEY);
  localStorage.removeItem(PIPELINES_KEY);
  localStorage.removeItem(LAST_PIPELINE_KEY);
  clearHistory();
}

