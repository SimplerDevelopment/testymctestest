'use client';

import { useCallback, useState } from 'react';
import { Block, BlockEditorData } from '@/types/blocks';
import { BlockStyleWrapper } from './BlockStyleWrapper';
import { SelectableBlock } from '@/components/visual-editor/SelectableBlock';
import { useEditorModeContext } from '@/components/visual-editor/EditorModeProvider';
import { getBlockRegistry } from '@/lib/visual-editor/registry';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
// Using manual translate3d instead of CSS.Transform to avoid unwanted scaling

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function removeBlock(blocks: Block[], blockId: string): Block[] {
  return blocks.filter(b => b.id !== blockId).map(b => {
    if (b.type === 'columns') return { ...b, columns: b.columns.map(c => ({ ...c, blocks: removeBlock(c.blocks, blockId) })) };
    if (b.type === 'tabs') return { ...b, tabs: b.tabs.map(t => ({ ...t, blocks: removeBlock(t.blocks, blockId) })) };
    if (b.type === 'section') return { ...b, blocks: removeBlock(b.blocks, blockId) };
    return b;
  });
}

function findBlock(blocks: Block[], blockId: string): Block | null {
  for (const b of blocks) {
    if (b.id === blockId) return b;
    if (b.type === 'columns') for (const c of b.columns) { const f = findBlock(c.blocks, blockId); if (f) return f; }
    if (b.type === 'tabs') for (const t of b.tabs) { const f = findBlock(t.blocks, blockId); if (f) return f; }
    if (b.type === 'section') { const f = findBlock(b.blocks, blockId); if (f) return f; }
  }
  return null;
}

function allBlockIds(blocks: Block[]): string[] {
  const ids: string[] = [];
  for (const b of blocks) {
    ids.push(b.id);
    if (b.type === 'columns') b.columns.forEach(c => ids.push(...allBlockIds(c.blocks)));
    if (b.type === 'tabs') b.tabs.forEach(t => ids.push(...allBlockIds(t.blocks)));
    if (b.type === 'section') ids.push(...allBlockIds(b.blocks));
  }
  return ids;
}

// ─── Draggable block list (editor mode) ──────────────────────────────────────

function DraggableBlockList({
  blocks,
  editor,
  registry,
}: {
  blocks: Block[];
  editor: ReturnType<typeof useEditorModeContext>;
  registry: ReturnType<typeof getBlockRegistry>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 15 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;
      const draggedBlock = findBlock(blocks, activeId);
      if (!draggedBlock) return;

      // Drop into a container slot: "container:{containerId}:{slotIndex}"
      if (overId.startsWith('container:')) {
        const parts = overId.split(':');
        const containerId = parts[1];
        const slotIndex = parseInt(parts[2]);
        let updated = removeBlock(blocks, activeId);
        updated = insertIntoContainer(updated, containerId, slotIndex, draggedBlock);
        editor.onBlocksReordered(updated);
        return;
      }

      // Drop between blocks: "between:{blockId}:{position}" (before/after)
      if (overId.startsWith('between:')) {
        const parts = overId.split(':');
        const targetId = parts[1];
        const position = parts[2] as 'before' | 'after';
        let updated = removeBlock(blocks, activeId);
        updated = insertNearBlock(updated, targetId, position, draggedBlock);
        editor.onBlocksReordered(updated);
        return;
      }

      // Simple top-level reorder (fallback)
      const oldIndex = blocks.findIndex((b) => b.id === activeId);
      const newIndex = blocks.findIndex((b) => b.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        let updated = removeBlock(blocks, activeId);
        updated.splice(newIndex > oldIndex ? newIndex - 1 : newIndex, 0, draggedBlock);
        editor.onBlocksReordered(updated);
      }
    },
    [blocks, editor],
  );

  const ids = allBlockIds(blocks);

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="block-content">
          {blocks.map((block, i) => (
            <div key={block.id}>
              {/* Drop zone before this block */}
              <DropIndicator id={`between:${block.id}:before`} dragging={draggingId !== null} />
              <SortableBlock
                block={block}
                isSelected={editor.selectedBlockId === block.id}
                isHovered={editor.hoveredBlockId === block.id}
                onClicked={editor.onBlockClicked}
                onHovered={editor.onBlockHovered}
                onAddAfter={editor.onAddBlockAfter}
                onResize={editor.onBlockResized}
                registry={registry}
                draggingId={draggingId}
                editor={editor}
              />
              {/* Drop zone after last block */}
              {i === blocks.length - 1 && (
                <DropIndicator id={`between:${block.id}:after`} dragging={draggingId !== null} />
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ─── Drop indicator line between blocks ──────────────────────────────────────

function DropIndicator({ id, dragging }: { id: string; dragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  if (!dragging) return <div className="h-2" />;

  return (
    <div
      ref={setNodeRef}
      className="relative"
      style={{ height: isOver ? '8px' : '8px', transition: 'all 150ms ease' }}
    >
      {isOver && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-blue-500 rounded-full">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
}

// ─── Container drop zone (inside columns/sections) ───────────────────────────

function ContainerSlotDropZone({ containerId, slotIndex, hasChildren }: { containerId: string; slotIndex: number; hasChildren: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${containerId}:${slotIndex}` });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border-2 border-dashed text-center text-xs transition-all ${
        isOver
          ? 'border-blue-400 bg-blue-50 text-blue-600 py-6'
          : hasChildren
            ? 'border-transparent py-1'
            : 'border-gray-200 text-gray-400 py-4'
      }`}
    >
      {isOver ? '+ Drop here' : hasChildren ? '' : 'Drop blocks here'}
    </div>
  );
}

// ─── Sortable block with nested rendering ────────────────────────────────────

function SortableBlock({
  block,
  isSelected,
  isHovered,
  onClicked,
  onHovered,
  onAddAfter,
  onResize,
  registry,
  draggingId,
  editor,
}: {
  block: Block;
  isSelected: boolean;
  isHovered: boolean;
  onClicked: (id: string) => void;
  onHovered: (id: string | null) => void;
  onAddAfter?: (id: string) => void;
  onResize?: (id: string, width: string | undefined, height: string | undefined) => void;
  registry: ReturnType<typeof getBlockRegistry>;
  draggingId: string | null;
  editor: ReturnType<typeof useEditorModeContext>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : undefined,
  };

  const Component = registry.get(block.type);
  if (!Component) return null;

  // For container blocks (columns), render children with drop zones
  const isContainer = block.type === 'columns' || block.type === 'section' || block.type === 'tabs';

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
        onResize={onResize}
        dragListeners={listeners}
      >
        {isContainer ? (
          <ContainerBlockRenderer block={block} registry={registry} draggingId={draggingId} editor={editor} />
        ) : (
          <BlockStyleWrapper block={block}>
            <Component block={block} />
          </BlockStyleWrapper>
        )}
      </SelectableBlock>
    </div>
  );
}

// ─── Nested draggable block (inside containers) ─────────────────────────────

function NestedSortableBlock({
  block,
  registry,
  editor,
  draggingId,
}: {
  block: Block;
  registry: ReturnType<typeof getBlockRegistry>;
  editor: ReturnType<typeof useEditorModeContext>;
  draggingId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : undefined,
  };

  const Component = registry.get(block.type);
  if (!Component) return null;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {draggingId && <DropIndicator id={`between:${block.id}:before`} dragging={true} />}
      <SelectableBlock
        blockId={block.id}
        blockType={block.type}
        isSelected={editor.selectedBlockId === block.id}
        isHovered={editor.hoveredBlockId === block.id || isDragging}
        onClicked={editor.onBlockClicked}
        onHovered={editor.onBlockHovered}
        onAddAfter={editor.onAddBlockAfter}
        onResize={editor.onBlockResized}
        dragListeners={listeners}
      >
        <BlockStyleWrapper block={block}>
          <Component block={block} />
        </BlockStyleWrapper>
      </SelectableBlock>
    </div>
  );
}

// ─── Container block renderer (columns with nested drop zones) ───────────────

function ContainerBlockRenderer({
  block,
  registry,
  draggingId,
  editor,
}: {
  block: Block;
  registry: ReturnType<typeof getBlockRegistry>;
  draggingId: string | null;
  editor: ReturnType<typeof useEditorModeContext>;
}) {
  if (block.type === 'columns') {
    const gapClass = { sm: 'gap-4', md: 'gap-6', lg: 'gap-8' }[block.gap || 'md'];
    return (
      <div className={`flex ${gapClass} py-4`}>
        {block.columns.map((col, i) => (
          <div key={col.id} style={{ width: `${col.width}%` }} className="min-h-[60px]">
            {col.blocks.map((nested, ni) => (
              <div key={nested.id}>
                <NestedSortableBlock block={nested} registry={registry} editor={editor} draggingId={draggingId} />
                {ni === col.blocks.length - 1 && draggingId && (
                  <DropIndicator id={`between:${nested.id}:after`} dragging={true} />
                )}
              </div>
            ))}
            <ContainerSlotDropZone containerId={block.id} slotIndex={i} hasChildren={col.blocks.length > 0} />
          </div>
        ))}
      </div>
    );
  }

  if (block.type === 'section') {
    return (
      <div className="py-4 px-2 border border-dashed border-gray-200 rounded min-h-[60px]">
        {block.blocks.map((nested, ni) => (
          <div key={nested.id}>
            <NestedSortableBlock block={nested} registry={registry} editor={editor} draggingId={draggingId} />
            {ni === block.blocks.length - 1 && draggingId && (
              <DropIndicator id={`between:${nested.id}:after`} dragging={true} />
            )}
          </div>
        ))}
        <ContainerSlotDropZone containerId={block.id} slotIndex={0} hasChildren={block.blocks.length > 0} />
      </div>
    );
  }

  // Fallback: render via registry
  const Component = registry.get(block.type);
  if (!Component) return null;
  return (
    <BlockStyleWrapper block={block}>
      <Component block={block} />
    </BlockStyleWrapper>
  );
}

// ─── Helpers for inserting blocks ────────────────────────────────────────────

function insertNearBlock(blocks: Block[], targetId: string, position: 'before' | 'after', blockToInsert: Block): Block[] {
  const result: Block[] = [];
  for (const b of blocks) {
    if (b.id === targetId) {
      if (position === 'before') { result.push(blockToInsert); result.push(b); }
      else { result.push(b); result.push(blockToInsert); }
    } else {
      const updated = { ...b };
      if (b.type === 'columns') {
        (updated as typeof b).columns = b.columns.map(c => ({ ...c, blocks: insertNearBlock(c.blocks, targetId, position, blockToInsert) }));
      }
      if (b.type === 'tabs') {
        (updated as typeof b).tabs = b.tabs.map(t => ({ ...t, blocks: insertNearBlock(t.blocks, targetId, position, blockToInsert) }));
      }
      if (b.type === 'section') {
        (updated as typeof b).blocks = insertNearBlock(b.blocks, targetId, position, blockToInsert);
      }
      result.push(updated);
    }
  }
  return result;
}

function insertIntoContainer(blocks: Block[], containerId: string, slotIndex: number, blockToInsert: Block): Block[] {
  return blocks.map(b => {
    if (b.id === containerId) {
      if (b.type === 'columns') {
        return { ...b, columns: b.columns.map((c, i) => i === slotIndex ? { ...c, blocks: [...c.blocks, blockToInsert] } : c) };
      }
      if (b.type === 'tabs') {
        return { ...b, tabs: b.tabs.map((t, i) => i === slotIndex ? { ...t, blocks: [...t.blocks, blockToInsert] } : t) };
      }
      if (b.type === 'section') {
        return { ...b, blocks: [...b.blocks, blockToInsert] };
      }
    }
    if (b.type === 'columns') return { ...b, columns: b.columns.map(c => ({ ...c, blocks: insertIntoContainer(c.blocks, containerId, slotIndex, blockToInsert) })) };
    if (b.type === 'tabs') return { ...b, tabs: b.tabs.map(t => ({ ...t, blocks: insertIntoContainer(t.blocks, containerId, slotIndex, blockToInsert) })) };
    if (b.type === 'section') return { ...b, blocks: insertIntoContainer(b.blocks, containerId, slotIndex, blockToInsert) };
    return b;
  });
}
