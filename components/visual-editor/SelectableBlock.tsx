'use client';

import React, { useCallback, useRef } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface SelectableBlockProps {
  blockId: string;
  blockType?: string;
  isSelected: boolean;
  isHovered: boolean;
  onClicked: (blockId: string) => void;
  onHovered: (blockId: string | null) => void;
  onAddAfter?: (blockId: string) => void;
  onResize?: (blockId: string, width: string | undefined, height: string | undefined) => void;
  dragListeners?: SyntheticListenerMap;
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
  dragListeners,
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
