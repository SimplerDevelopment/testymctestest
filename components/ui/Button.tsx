'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'warm';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

const variants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border-2 border-blue-600 bg-transparent hover:bg-blue-600 hover:text-white',
  ghost: 'bg-transparent hover:bg-blue-50',
  warm: 'bg-amber-500 text-white hover:bg-amber-600',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({ children, href, onClick, variant = 'default', size = 'md', className = '', disabled = false, type = 'button', style }: ButtonProps) {
  const baseClasses = `inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`;

  if (href && !disabled) {
    return <Link href={href} className={baseClasses} style={style}>{children}</Link>;
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={baseClasses} style={style}>
      {children}
    </button>
  );
}
