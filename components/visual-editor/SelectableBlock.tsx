'use client';

import React from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface SelectableBlockProps {
  blockId: string;
  blockType?: string;
  isSelected: boolean;
  isHovered: boolean;
  onClicked: (blockId: string) => void;
  onHovered: (blockId: string | null) => void;
  onAddAfter?: (blockId: string) => void;
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
  dragListeners,
  children,
}: SelectableBlockProps) {
  const showControls = isSelected || isHovered;

  return (
    <div
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
