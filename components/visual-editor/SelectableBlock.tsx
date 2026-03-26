'use client';

import React, { useCallback, useRef, useState } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { ColumnsEditorOverlay } from './ColumnsEditorOverlay';

interface ColumnData {
  id: string;
  width: number;
}

interface SelectableBlockProps {
  blockId: string;
  blockType?: string;
  isSelected: boolean;
  isHovered: boolean;
  onClicked: (blockId: string) => void;
  onHovered: (blockId: string | null) => void;
  onAddAfter?: (blockId: string) => void;
  onResize?: (blockId: string, width: string | undefined, height: string | undefined) => void;
  onStyleUpdate?: (blockId: string, style: Record<string, string>) => void;
  currentStyle?: { padding?: string; margin?: string };
  dragListeners?: SyntheticListenerMap;
  /** For columns blocks: pass column data to render resize/gap controls */
  columnsData?: { columns: ColumnData[]; gap?: 'sm' | 'md' | 'lg' };
  children: React.ReactNode;
}

export function SelectableBlock({
  blockId,
  blockType,
  isSelected,
  isHovered,
  onClicked,
  onHovered,
  onAddAfter,
  onResize,
  onStyleUpdate,
  currentStyle,
  dragListeners,
  columnsData,
  children,
}: SelectableBlockProps) {
  const showControls = isSelected || isHovered;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      data-block-id={blockId}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClicked(blockId);
      }}
      onMouseEnter={() => onHovered(blockId)}
      onMouseLeave={() => onHovered(null)}
      className="relative cursor-pointer"
      style={{
        outline: isSelected
          ? '2px solid #3b82f6'
          : isHovered
            ? '1px dashed #94a3b8'
            : 'none',
        outlineOffset: '2px',
        borderRadius: '4px',
        transition: 'outline 0.15s ease',
      }}
    >
      {/* Top toolbar on hover/select */}
      {showControls && (
        <div
          className="absolute -top-6 left-1 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-t z-50"
          style={{
            backgroundColor: isSelected ? '#3b82f6' : '#64748b',
            color: 'white',
          }}
        >
          {dragListeners && (
            <span
              {...dragListeners}
              className="cursor-grab active:cursor-grabbing"
              style={{ lineHeight: 1, fontSize: '12px' }}
              onClick={(e) => e.stopPropagation()}
            >
              ⠿
            </span>
          )}
          <span>{blockType || 'Block'}</span>
        </div>
      )}

      {/* Content — prevent link navigation */}
      <div style={{ pointerEvents: 'none' }} onClick={(e) => e.preventDefault()}>
        <div style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      </div>

      {/* Resize handles (selected only) */}
      {isSelected && onResize && (
        <>
          <ResizeHandle
            direction="right"
            containerRef={containerRef}
            onResizeEnd={(w, h) => onResize(blockId, w, h)}
          />
          <ResizeHandle
            direction="bottom"
            containerRef={containerRef}
            onResizeEnd={(w, h) => onResize(blockId, w, h)}
          />
          <ResizeHandle
            direction="corner"
            containerRef={containerRef}
            onResizeEnd={(w, h) => onResize(blockId, w, h)}
          />
        </>
      )}

      {/* Spacing drag handles (padding/margin) */}
      {isSelected && onStyleUpdate && (
        <SpacingHandles
          blockId={blockId}
          currentStyle={currentStyle}
          onStyleUpdate={onStyleUpdate}
        />
      )}

      {/* Column resize + gap drag controls */}
      {isSelected && columnsData && columnsData.columns.length > 1 && (
        <ColumnsEditorOverlay
          blockId={blockId}
          columns={columnsData.columns}
          gap={columnsData.gap}
          containerRef={containerRef}
        />
      )}

      {/* "+" add block button at bottom */}
      {showControls && onAddAfter && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddAfter(blockId);
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: '2px solid white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              lineHeight: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.2)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Resize Handle ───────────────────────────────────────────────────────────

function ResizeHandle({
  direction,
  containerRef,
  onResizeEnd,
}: {
  direction: 'right' | 'bottom' | 'corner';
  containerRef: React.RefObject<HTMLDivElement | null>;
  onResizeEnd: (width: string | undefined, height: string | undefined) => void;
}) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = container.offsetWidth;
      const startHeight = container.offsetHeight;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (direction === 'right' || direction === 'corner') {
          container.style.width = `${startWidth + dx}px`;
        }
        if (direction === 'bottom' || direction === 'corner') {
          container.style.height = `${startHeight + dy}px`;
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const w = direction === 'right' || direction === 'corner'
          ? `${container.offsetWidth}px`
          : undefined;
        const h = direction === 'bottom' || direction === 'corner'
          ? `${container.offsetHeight}px`
          : undefined;

        onResizeEnd(w, h);
      };

      document.body.style.cursor =
        direction === 'corner' ? 'nwse-resize' :
        direction === 'right' ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [direction, containerRef, onResizeEnd],
  );

  const styles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 51,
    backgroundColor: '#3b82f6',
    border: '1.5px solid white',
    borderRadius: direction === 'corner' ? '2px' : '1px',
  };

  if (direction === 'right') {
    return (
      <div
        onMouseDown={handleMouseDown}
        style={{
          ...styles,
          right: '-5px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '6px',
          height: '24px',
          cursor: 'ew-resize',
        }}
      />
    );
  }

  if (direction === 'bottom') {
    return (
      <div
        onMouseDown={handleMouseDown}
        style={{
          ...styles,
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '6px',
          cursor: 'ns-resize',
        }}
      />
    );
  }

  // corner
  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        ...styles,
        right: '-5px',
        bottom: '-5px',
        width: '8px',
        height: '8px',
        cursor: 'nwse-resize',
      }}
    />
  );
}

// ─── Spacing Handles (Padding + Margin drag controls) ────────────────────────

type SpacingSide = 'top' | 'right' | 'bottom' | 'left';

function parseSpacing(value?: string): { top: number; right: number; bottom: number; left: number } {
  if (!value) return { top: 0, right: 0, bottom: 0, left: 0 };
  const parts = value.replace(/px/g, '').trim().split(/\s+/).map(Number);
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

function toSpacingString(s: { top: number; right: number; bottom: number; left: number }): string {
  if (s.top === s.right && s.right === s.bottom && s.bottom === s.left) return `${s.top}px`;
  if (s.top === s.bottom && s.left === s.right) return `${s.top}px ${s.right}px`;
  return `${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`;
}

function SpacingHandles({
  blockId,
  currentStyle,
  onStyleUpdate,
}: {
  blockId: string;
  currentStyle?: { padding?: string; margin?: string };
  onStyleUpdate: (blockId: string, style: Record<string, string>) => void;
}) {
  const [activeHandle, setActiveHandle] = useState<{ type: 'padding' | 'margin'; side: SpacingSide } | null>(null);
  const [liveLabel, setLiveLabel] = useState<string | null>(null);

  const handleMouseDown = useCallback(
    (type: 'padding' | 'margin', side: SpacingSide, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const current = parseSpacing(type === 'padding' ? currentStyle?.padding : currentStyle?.margin);
      const startVal = current[side];

      setActiveHandle({ type, side });
      setLiveLabel(`${type} ${side}: ${startVal}px`);

      const handleMove = (me: MouseEvent) => {
        const isVertical = side === 'top' || side === 'bottom';
        const delta = isVertical
          ? me.clientY - startY
          : startX - me.clientX;
        const newVal = Math.max(0, Math.round(startVal + delta));
        const updated = { ...current, [side]: newVal };
        setLiveLabel(`${type} ${side}: ${newVal}px`);
        onStyleUpdate(blockId, { [type]: toSpacingString(updated) });
      };

      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setActiveHandle(null);
        setLiveLabel(null);
      };

      document.body.style.cursor = isVertical(side) ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [blockId, currentStyle, onStyleUpdate],
  );

  const padding = parseSpacing(currentStyle?.padding);
  const margin = parseSpacing(currentStyle?.margin);

  const sides: SpacingSide[] = ['top', 'right', 'bottom', 'left'];

  return (
    <>
      {/* Live value tooltip */}
      {liveLabel && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#1e293b',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            zIndex: 60,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {liveLabel}
        </div>
      )}

      {/* Padding handles (inner edges) */}
      {sides.map((side) => (
        <SpacingHandle
          key={`padding-${side}`}
          type="padding"
          side={side}
          value={padding[side]}
          isActive={activeHandle?.type === 'padding' && activeHandle?.side === side}
          onMouseDown={(e) => handleMouseDown('padding', side, e)}
        />
      ))}

      {/* Margin handles (outer edges) */}
      {sides.map((side) => (
        <SpacingHandle
          key={`margin-${side}`}
          type="margin"
          side={side}
          value={margin[side]}
          isActive={activeHandle?.type === 'margin' && activeHandle?.side === side}
          onMouseDown={(e) => handleMouseDown('margin', side, e)}
        />
      ))}
    </>
  );
}

function isVertical(side: SpacingSide): boolean {
  return side === 'top' || side === 'bottom';
}

function SpacingHandle({
  type,
  side,
  value,
  isActive,
  onMouseDown,
}: {
  type: 'padding' | 'margin';
  side: SpacingSide;
  value: number;
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const isPadding = type === 'padding';
  const color = isPadding ? 'rgba(34,197,94,0.6)' : 'rgba(249,115,22,0.6)';
  const activeColor = isPadding ? 'rgba(34,197,94,0.9)' : 'rgba(249,115,22,0.9)';
  const offset = isPadding ? 0 : -8;
  const vertical = isVertical(side);
  const cursor = vertical ? 'ns-resize' : 'ew-resize';

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: isPadding ? 52 : 53,
    cursor,
    backgroundColor: isActive ? activeColor : 'transparent',
    transition: 'background-color 0.15s',
  };

  // Size and position depend on side
  if (vertical) {
    Object.assign(positionStyle, {
      left: '10%',
      width: '80%',
      height: '6px',
      ...(side === 'top'
        ? { top: `${offset}px` }
        : { bottom: `${offset}px` }),
    });
  } else {
    Object.assign(positionStyle, {
      top: '10%',
      height: '80%',
      width: '6px',
      ...(side === 'left'
        ? { left: `${offset}px` }
        : { right: `${offset}px` }),
    });
  }

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = color; }}
      onMouseLeave={(e) => { if (!isActive) (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
      style={positionStyle}
      title={`Drag to adjust ${type}-${side} (${value}px)`}
    />
  );
}
