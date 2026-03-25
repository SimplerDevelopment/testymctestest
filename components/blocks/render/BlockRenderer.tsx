'use client';

import { Block, BlockEditorData } from '@/types/blocks';
import { BlockStyleWrapper } from './BlockStyleWrapper';
import { SelectableBlock } from '@/components/visual-editor/SelectableBlock';
import { useEditorModeContext } from '@/components/visual-editor/EditorModeProvider';
import { getBlockRegistry } from '@/lib/visual-editor/registry';

interface BlockRendererProps {
  content: string;
}

export function BlockRenderer({ content }: BlockRendererProps) {
  const editor = useEditorModeContext();
  const registry = getBlockRegistry();

  // In editor mode, use blocks from the parent editor instead of parsed content
  let blocks: Block[] = [];

  if (editor.active && editor.blocks.length > 0) {
    blocks = editor.blocks;
  } else {
    try {
      const data = JSON.parse(content) as BlockEditorData;
      blocks = data.blocks || [];
    } catch {
      return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    }
  }

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="block-content space-y-6">
      {blocks.map((block) => {
        const Component = registry.get(block.type);
        if (!Component) return null;

        const rendered = (
          <BlockStyleWrapper block={block}>
            <Component block={block} />
          </BlockStyleWrapper>
        );

        if (editor.active) {
          return (
            <SelectableBlock
              key={block.id}
              blockId={block.id}
              isSelected={editor.selectedBlockId === block.id}
              isHovered={editor.hoveredBlockId === block.id}
              onClicked={editor.onBlockClicked}
              onHovered={editor.onBlockHovered}
            >
              {rendered}
            </SelectableBlock>
          );
        }

        return (
          <div key={block.id} className="block-wrapper">
            {rendered}
          </div>
        );
      })}
    </div>
  );
}
