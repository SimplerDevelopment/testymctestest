// Shared visual editor message protocol — copy from main platform

export type MessageSource = 'sd-editor-parent' | 'sd-editor-iframe';

export interface VisualEditorMessage<T = unknown> {
  source: MessageSource;
  type: string;
  payload: T;
  timestamp: number;
}

export interface ComponentManifestEntry {
  type: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  inputs: PropSchema[];
  defaultProps: Record<string, unknown>;
}

export type PropSchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'color'
  | 'url'
  | 'richtext'
  | 'image'
  | 'list';

export interface PropSchema {
  name: string;
  label: string;
  type: PropSchemaType;
  defaultValue?: unknown;
  required?: boolean;
  enumOptions?: { label: string; value: string }[];
  listItemSchema?: PropSchema[];
}

// Message type constants
export const PARENT_MESSAGES = {
  EDITOR_INIT: 'EDITOR_INIT',
  BLOCKS_UPDATE: 'BLOCKS_UPDATE',
  SELECT_BLOCK: 'SELECT_BLOCK',
  HOVER_BLOCK: 'HOVER_BLOCK',
  EXIT_EDIT_MODE: 'EXIT_EDIT_MODE',
  PAGE_SETTINGS_UPDATE: 'PAGE_SETTINGS_UPDATE',
} as const;

export const IFRAME_MESSAGES = {
  IFRAME_READY: 'IFRAME_READY',
  BLOCK_CLICKED: 'BLOCK_CLICKED',
  BLOCK_HOVERED: 'BLOCK_HOVERED',
  COMPONENT_REGISTRY: 'COMPONENT_REGISTRY',
} as const;

const ALLOWED_ORIGINS = [
  'simplerdevelopment.com',
  '.simplerdevelopment.com',
  '.up.railway.app',
];

export function isValidOrigin(origin: string): boolean {
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return true;
  }
  try {
    const hostname = new URL(origin).hostname;
    return ALLOWED_ORIGINS.some((allowed) =>
      allowed.startsWith('.') ? hostname.endsWith(allowed) || hostname === allowed.slice(1) : hostname === allowed,
    );
  } catch {
    return false;
  }
}

export function isVisualEditorMessage(data: unknown): data is VisualEditorMessage {
  if (!data || typeof data !== 'object') return false;
  const msg = data as Record<string, unknown>;
  return (
    (msg.source === 'sd-editor-parent' || msg.source === 'sd-editor-iframe') &&
    typeof msg.type === 'string' &&
    typeof msg.timestamp === 'number'
  );
}

function createMessage<T>(source: MessageSource, type: string, payload: T): VisualEditorMessage<T> {
  return { source, type, payload, timestamp: Date.now() };
}

export function sendToParent(type: string, payload: unknown): void {
  if (typeof window === 'undefined' || !window.parent || window.parent === window) return;
  window.parent.postMessage(createMessage('sd-editor-iframe', type, payload), '*');
}
