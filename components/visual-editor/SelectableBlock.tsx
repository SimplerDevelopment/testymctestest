'use client';

import React from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface SelectableBlockProps {
  blockId: string;
  isSelected: boolean;
  isHovered: boolean;
  onClicked: (blockId: string) => void;
  onHovered: (blockId: string | null) => void;
  dragListeners?: SyntheticListenerMap;
  children: React.ReactNode;
}

export function SelectableBlock({
  blockId,
  isSelected,
  isHovered,
  onClicked,
  onHovered,
  dragListeners,
  children,
}: SelectableBlockProps) {
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
      className="relative cursor-pointer transition-all"
      style={{
        outline: isSelected
          ? '2px solid #3b82f6'
          : isHovered
            ? '2px dashed #94a3b8'
            : '2px solid transparent',
        outlineOffset: '2px',
        borderRadius: '4px',
      }}
    >
      {/* Toolbar on hover/select */}
      {(isSelected || isHovered) && (
        <div
          className="absolute -top-7 left-0 flex items-center gap-1 text-xs font-medium px-1 py-0.5 rounded z-50"
          style={{ backgroundColor: isSelected ? '#3b82f6' : '#94a3b8', color: 'white' }}
        >
          {dragListeners && (
            <span
              {...dragListeners}
              className="cursor-grab active:cursor-grabbing"
              style={{ lineHeight: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              ⠿
            </span>
          )}
          <span>Block</span>
        </div>
      )}
      {/* Prevent link clicks in edit mode */}
      <div style={{ pointerEvents: 'none' }} onClick={(e) => e.preventDefault()}>
        <div style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
