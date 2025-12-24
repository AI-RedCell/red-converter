// ==================== PIPELINE UTILITIES ====================
// Improvements #13-20: Pipeline presets, export/import, file I/O

import { PipelineStep } from './pipeline';

// ===== IMPROVEMENT #13-15: Pipeline Presets Storage =====
export interface PipelinePreset {
  id: string;
  name: string;
  description: string;
  steps: Omit<PipelineStep, 'id'>[];
  createdAt: number;
}

const PRESETS_KEY = 'red-converter-presets';

export function savePreset(preset: Omit<PipelinePreset, 'id' | 'createdAt'>): PipelinePreset {
  const presets = getPresets();
  const newPreset: PipelinePreset = {
    ...preset,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  presets.push(newPreset);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  return newPreset;
}

export function getPresets(): PipelinePreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deletePreset(id: string): void {
  const presets = getPresets().filter(p => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function loadPreset(id: string): PipelineStep[] | null {
  const preset = getPresets().find(p => p.id === id);
  if (!preset) return null;
  
  // Generate new IDs for each step
  return preset.steps.map(step => ({
    ...step,
    id: crypto.randomUUID(),
  }));
}

// ===== IMPROVEMENT #14: Export Pipeline as JSON =====
export function exportPipeline(steps: PipelineStep[], name: string = 'pipeline'): void {
  const exportData = {
    name,
    version: '1.0',
    exportedAt: new Date().toISOString(),
    steps: steps.map(({ transformationId, mode, options }) => ({
      transformationId,
      mode,
      options,
    })),
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== IMPROVEMENT #15: Import Pipeline from JSON =====
export function importPipeline(file: File): Promise<PipelineStep[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.steps || !Array.isArray(data.steps)) {
          throw new Error('Invalid pipeline file format');
        }
        
        const steps: PipelineStep[] = data.steps.map((step: any) => ({
          id: crypto.randomUUID(),
          transformationId: step.transformationId,
          mode: step.mode,
          options: step.options,
        }));
        
        resolve(steps);
      } catch (error) {
        reject(new Error('Failed to parse pipeline file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ===== IMPROVEMENT #18: File Input Support =====
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ===== IMPROVEMENT #19: File Output (Download) =====
export function downloadAsFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== IMPROVEMENT #16: Keyboard Shortcuts Handler =====
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
  description: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Enter', ctrl: true, action: 'execute', description: 'Execute pipeline' },
  { key: 'c', ctrl: true, shift: true, action: 'copy', description: 'Copy output' },
  { key: 'Delete', ctrl: true, action: 'clear', description: 'Clear all' },
  { key: 's', ctrl: true, action: 'save', description: 'Save preset' },
  { key: 'o', ctrl: true, action: 'open', description: 'Open file' },
  { key: 'd', ctrl: true, action: 'download', description: 'Download output' },
  { key: '1', ctrl: true, action: 'mode-encode', description: 'Switch to Encode mode' },
  { key: '2', ctrl: true, action: 'mode-decode', description: 'Switch to Decode mode' },
  { key: '3', ctrl: true, action: 'mode-detect', description: 'Switch to Detect mode' },
];

export function matchShortcut(event: KeyboardEvent): string | null {
  for (const shortcut of KEYBOARD_SHORTCUTS) {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
    const shiftMatch = !!shortcut.shift === event.shiftKey;
    const altMatch = !!shortcut.alt === event.altKey;
    
    if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
      return shortcut.action;
    }
  }
  return null;
}

// ===== IMPROVEMENT #20: Compare View Utility =====
export interface CompareResult {
  added: number;
  removed: number;
  changed: number;
  inputLength: number;
  outputLength: number;
  ratio: number;
}

export function compareTexts(input: string, output: string): CompareResult {
  const inputChars = new Set(input.split(''));
  const outputChars = new Set(output.split(''));
  
  let added = 0;
  let removed = 0;
  
  for (const char of outputChars) {
    if (!inputChars.has(char)) added++;
  }
  
  for (const char of inputChars) {
    if (!outputChars.has(char)) removed++;
  }
  
  return {
    added,
    removed,
    changed: Math.abs(input.length - output.length),
    inputLength: input.length,
    outputLength: output.length,
    ratio: output.length / (input.length || 1),
  };
}

// ===== BUILT-IN PRESETS =====
export const BUILT_IN_PRESETS: PipelinePreset[] = [
  {
    id: 'builtin-base64-hex',
    name: 'Base64 → Hex',
    description: 'Encode to Base64, then to Hex',
    steps: [
      { transformationId: 'base64', mode: 'encode' },
      { transformationId: 'hex', mode: 'encode' },
    ],
    createdAt: 0,
  },
  {
    id: 'builtin-rot13-base64',
    name: 'ROT13 → Base64',
    description: 'Apply ROT13, then Base64 encode',
    steps: [
      { transformationId: 'rot13', mode: 'encode' },
      { transformationId: 'base64', mode: 'encode' },
    ],
    createdAt: 0,
  },
  {
    id: 'builtin-url-base64',
    name: 'URL → Base64',
    description: 'URL encode, then Base64',
    steps: [
      { transformationId: 'url', mode: 'encode' },
      { transformationId: 'base64', mode: 'encode' },
    ],
    createdAt: 0,
  },
  {
    id: 'builtin-reverse-base64',
    name: 'Reverse → Base64 → Hex',
    description: 'Triple encoding for obfuscation',
    steps: [
      { transformationId: 'reverse', mode: 'encode' },
      { transformationId: 'base64', mode: 'encode' },
      { transformationId: 'hex', mode: 'encode' },
    ],
    createdAt: 0,
  },
  {
    id: 'builtin-analysis',
    name: 'Full Analysis',
    description: 'Character stats + Frequency analysis',
    steps: [
      { transformationId: 'char-stats', mode: 'encode' },
    ],
    createdAt: 0,
  },
];
