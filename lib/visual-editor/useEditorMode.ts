'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const MAX_HISTORY = 50;

export function useEditorMode() {
  const [state, setState] = useState<EditorState>({
    active: false,
    blocks: [],
    selectedBlockId: null,
    hoveredBlockId: null,
  });

  // Undo/redo history
  const historyRef = useRef<Block[][]>([]);
  const futureRef = useRef<Block[][]>([]);
  const skipHistoryRef = useRef(false);
  // Ref to current blocks so the stable message handler can access them
  const blocksRef = useRef<Block[]>(state.blocks);
  blocksRef.current = state.blocks;

  const pushHistory = useCallback((blocks: Block[]) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), blocks];
    futureRef.current = [];
  }, []);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, state.blocks];
    skipHistoryRef.current = true;
    setState((s) => ({ ...s, blocks: prev }));
    sendToParent(IFRAME_MESSAGES.BLOCKS_REORDERED, { blocks: prev });
  }, [state.blocks]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, state.blocks];
    skipHistoryRef.current = true;
    setState((s) => ({ ...s, blocks: next }));
    sendToParent(IFRAME_MESSAGES.BLOCKS_REORDERED, { blocks: next });
  }, [state.blocks]);

  // Store undo/redo in refs so the message handler can call them
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  // Broadcast undo/redo availability to parent
  const prevCanUndo = useRef(false);
  const prevCanRedo = useRef(false);
  useEffect(() => {
    if (!state.active) return;
    if (prevCanUndo.current !== canUndo || prevCanRedo.current !== canRedo) {
      prevCanUndo.current = canUndo;
      prevCanRedo.current = canRedo;
      sendToParent(IFRAME_MESSAGES.UNDO_REDO_STATE, { canUndo, canRedo });
    }
  }, [state.active, canUndo, canRedo]);

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
          // Don't overwrite local state during undo/redo
          if (skipHistoryRef.current) {
            skipHistoryRef.current = false;
            setState((s) => ({ ...s, blocks }));
            return;
          }
          // Push current state to history so parent-initiated changes (add/delete/update) are undoable
          const currentBlocks = blocksRef.current;
          if (currentBlocks.length > 0 && JSON.stringify(currentBlocks) !== JSON.stringify(blocks)) {
            historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), currentBlocks];
            futureRef.current = [];
          }
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
        case PARENT_MESSAGES.UNDO: {
          undoRef.current();
          break;
        }
        case PARENT_MESSAGES.REDO: {
          redoRef.current();
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

  const onBlocksReordered = useCallback(
    (newBlocks: Block[]) => {
      if (!state.active) return;
      pushHistory(state.blocks);
      setState((s) => ({ ...s, blocks: newBlocks }));
      sendToParent(IFRAME_MESSAGES.BLOCKS_REORDERED, { blocks: newBlocks });
    },
    [state.active, state.blocks, pushHistory],
  );

  const onAddBlockAfter = useCallback(
    (blockId: string) => {
      if (!state.active) return;
      sendToParent(IFRAME_MESSAGES.ADD_BLOCK_AFTER, { blockId });
    },
    [state.active],
  );

  const onBlockResized = useCallback(
    (blockId: string, width: string | undefined, height: string | undefined) => {
      if (!state.active) return;
      sendToParent(IFRAME_MESSAGES.BLOCK_RESIZED, { blockId, width, height });
    },
    [state.active],
  );

  const onBlockStyleUpdated = useCallback(
    (blockId: string, style: Record<string, string>) => {
      if (!state.active) return;
      // Recursively update block style (works for nested blocks too)
      const updateStyle = (blocks: Block[]): Block[] =>
        blocks.map(b => {
          if (b.id === blockId) return { ...b, style: { ...(b.style || {}), ...style } };
          if (b.type === 'columns') return { ...b, columns: b.columns.map(c => ({ ...c, blocks: updateStyle(c.blocks) })) };
          if (b.type === 'tabs') return { ...b, tabs: b.tabs.map(t => ({ ...t, blocks: updateStyle(t.blocks) })) };
          if (b.type === 'section') return { ...b, blocks: updateStyle(b.blocks) };
          return b;
        });
      pushHistory(state.blocks);
      setState((s) => ({ ...s, blocks: updateStyle(s.blocks) }));
      sendToParent(IFRAME_MESSAGES.BLOCK_STYLE_UPDATED, { blockId, style });
    },
    [state.active, state.blocks, pushHistory],
  );

  return {
    ...state,
    onBlockClicked,
    onBlockHovered,
    onBlocksReordered,
    onAddBlockAfter,
    onBlockResized,
    onBlockStyleUpdated,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
