'use client';

import { useCallback } from 'react';
import { Block, BlockEditorData } from '@/types/blocks';
import { BlockStyleWrapper } from './BlockStyleWrapper';
import { SelectableBlock } from '@/components/visual-editor/SelectableBlock';
import { useEditorModeContext } from '@/components/visual-editor/EditorModeProvider';
import { getBlockRegistry } from '@/lib/visual-editor/registry';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlockRendererProps {
  content: string;
}

export function BlockRenderer({ content }: BlockRendererProps) {
  const editor = useEditorModeContext();
  const registry = getBlockRegistry();

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

  if (blocks.length === 0) return null;

  if (editor.active) {
    return <DraggableBlockList blocks={blocks} editor={editor} registry={registry} />;
  }

  return (
    <div className="block-content space-y-6">
      {blocks.map((block) => {
        const Component = registry.get(block.type);
        if (!Component) return null;
        return (
          <div key={block.id} className="block-wrapper">
            <BlockStyleWrapper block={block}>
              <Component block={block} />
            </BlockStyleWrapper>
          </div>
        );
      })}
    </div>
  );
}

// ─── Draggable block list (editor mode only) ─────────────────────────────────

function DraggableBlockList({
  blocks,
  editor,
  registry,
}: {
  blocks: Block[];
  editor: ReturnType<typeof useEditorModeContext>;
  registry: ReturnType<typeof getBlockRegistry>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 15 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      editor.onBlocksReordered(arrayMove(blocks, oldIndex, newIndex));
    },
    [blocks, editor],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="block-content space-y-8">
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              isSelected={editor.selectedBlockId === block.id}
              isHovered={editor.hoveredBlockId === block.id}
              onClicked={editor.onBlockClicked}
              onHovered={editor.onBlockHovered}
              onAddAfter={editor.onAddBlockAfter}
              registry={registry}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableBlock({
  block,
  isSelected,
  isHovered,
  onClicked,
  onHovered,
  onAddAfter,
  registry,
}: {
  block: Block;
  isSelected: boolean;
  isHovered: boolean;
  onClicked: (id: string) => void;
  onHovered: (id: string | null) => void;
  onAddAfter?: (id: string) => void;
  registry: ReturnType<typeof getBlockRegistry>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : undefined,
  };

  const Component = registry.get(block.type);
  if (!Component) return null;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SelectableBlock
        blockId={block.id}
        blockType={block.type}
        isSelected={isSelected}
        isHovered={isHovered || isDragging}
        onClicked={onClicked}
        onHovered={onHovered}
        onAddAfter={onAddAfter}
        dragListeners={listeners}
      >
        <BlockStyleWrapper block={block}>
          <Component block={block} />
        </BlockStyleWrapper>
      </SelectableBlock>
    </div>
  );
}
