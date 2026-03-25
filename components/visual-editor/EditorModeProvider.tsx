'use client';

import React, { createContext, useContext } from 'react';
import { useEditorMode } from '@/lib/visual-editor/useEditorMode';
import type { Block, PageSettings } from '@/types/blocks';

interface EditorModeContextValue {
  active: boolean;
  blocks: Block[];
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  pageSettings?: PageSettings;
  onBlockClicked: (blockId: string) => void;
  onBlockHovered: (blockId: string | null) => void;
}

const EditorModeContext = createContext<EditorModeContextValue>({
  active: false,
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  onBlockClicked: () => {},
  onBlockHovered: () => {},
});

export function useEditorModeContext() {
  return useContext(EditorModeContext);
}

export function EditorModeProvider({ children }: { children: React.ReactNode }) {
  const editorMode = useEditorMode();

  return (
    <EditorModeContext.Provider value={editorMode}>
      {children}
    </EditorModeContext.Provider>
  );
}
