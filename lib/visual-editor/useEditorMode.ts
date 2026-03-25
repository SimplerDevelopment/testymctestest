'use client';

import { useCallback, useEffect, useState } from 'react';
import { isValidOrigin, isVisualEditorMessage, sendToParent, PARENT_MESSAGES, IFRAME_MESSAGES } from './protocol';
import type { Block, PageSettings } from '@/types/blocks';
import { getBlockRegistry } from './registry';

interface EditorState {
  active: boolean;
  blocks: Block[];
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  pageSettings?: PageSettings;
}

export function useEditorMode() {
  const [state, setState] = useState<EditorState>({
    active: false,
    blocks: [],
    selectedBlockId: null,
    hoveredBlockId: null,
  });

  // Detect edit mode and set up listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('_edit') !== 'true') return;

    // We're in edit mode inside an iframe
    setState((s) => ({ ...s, active: true }));

    function handleMessage(event: MessageEvent) {
      if (!isValidOrigin(event.origin)) return;
      if (!isVisualEditorMessage(event.data)) return;
      if (event.data.source !== 'sd-editor-parent') return;

      switch (event.data.type) {
        case PARENT_MESSAGES.EDITOR_INIT: {
          const { blocks, selectedBlockId, pageSettings } = event.data.payload as {
            blocks: Block[];
            selectedBlockId: string | null;
            pageSettings?: PageSettings;
          };
          setState((s) => ({ ...s, blocks, selectedBlockId, pageSettings }));
          break;
        }
        case PARENT_MESSAGES.BLOCKS_UPDATE: {
          const { blocks } = event.data.payload as { blocks: Block[] };
          setState((s) => ({ ...s, blocks }));
          break;
        }
        case PARENT_MESSAGES.SELECT_BLOCK: {
          const { blockId } = event.data.payload as { blockId: string | null };
          setState((s) => ({ ...s, selectedBlockId: blockId }));
          break;
        }
        case PARENT_MESSAGES.HOVER_BLOCK: {
          const { blockId } = event.data.payload as { blockId: string | null };
          setState((s) => ({ ...s, hoveredBlockId: blockId }));
          break;
        }
        case PARENT_MESSAGES.EXIT_EDIT_MODE: {
          setState((s) => ({ ...s, active: false }));
          break;
        }
        case PARENT_MESSAGES.PAGE_SETTINGS_UPDATE: {
          const { pageSettings } = event.data.payload as { pageSettings: PageSettings };
          setState((s) => ({ ...s, pageSettings }));
          break;
        }
      }
    }

    window.addEventListener('message', handleMessage);

    // Send ready signal with registered components
    const registry = getBlockRegistry();
    const manifests = registry.getCustomManifests();
    sendToParent(IFRAME_MESSAGES.IFRAME_READY, { registeredComponents: manifests });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const onBlockClicked = useCallback(
    (blockId: string) => {
      if (!state.active) return;
      setState((s) => ({ ...s, selectedBlockId: blockId }));
      sendToParent(IFRAME_MESSAGES.BLOCK_CLICKED, { blockId });
    },
    [state.active],
  );

  const onBlockHovered = useCallback(
    (blockId: string | null) => {
      if (!state.active) return;
      setState((s) => ({ ...s, hoveredBlockId: blockId }));
      sendToParent(IFRAME_MESSAGES.BLOCK_HOVERED, { blockId });
    },
    [state.active],
  );

  return { ...state, onBlockClicked, onBlockHovered };
}
