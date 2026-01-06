'use client';

import { cn } from '@/lib/utils';

export interface DividerProps {
  className?: string;
  /** Orientation of the divider */
  orientation?: 'horizontal' | 'vertical';
  /** Visual variant */
  variant?: 'solid' | 'dashed' | 'dotted';
  /** Label to display in the middle */
  label?: string;
  /** Label position */
  labelPosition?: 'left' | 'center' | 'right';
  /** Spacing around the divider */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const Divider = ({
  className,
  orientation = 'horizontal',
  variant = 'solid',
  label,
  labelPosition = 'center',
  spacing = 'md',
}: DividerProps) => {
  const spacings = {
    none: '',
    sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
    md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
    lg: orientation === 'horizontal' ? 'my-6' : 'mx-6',
  };

  const variants = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  const labelPositions = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  // Vertical divider
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'inline-block border-l border-gray-200 h-full min-h-[1em]',
          variants[variant],
          spacings[spacing],
          className
        )}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // Horizontal divider with label
  if (label) {
    return (
      <div
        className={cn(
          'flex items-center',
          spacings[spacing],
          labelPositions[labelPosition],
          className
        )}
        role="separator"
        aria-orientation="horizontal"
      >
        {labelPosition !== 'left' && (
          <div
            className={cn(
              'flex-1 border-t border-gray-200',
              variants[variant],
              labelPosition === 'center' ? 'mr-4' : ''
            )}
          />
        )}
        <span className="text-sm text-gray-500 flex-shrink-0 px-2">
          {label}
        </span>
        {labelPosition !== 'right' && (
          <div
            className={cn(
              'flex-1 border-t border-gray-200',
              variants[variant],
              labelPosition === 'center' ? 'ml-4' : ''
            )}
          />
        )}
      </div>
    );
  }

  // Simple horizontal divider
  return (
    <hr
      className={cn(
        'border-t border-gray-200',
        variants[variant],
        spacings[spacing],
        className
      )}
      role="separator"
      aria-orientation="horizontal"
    />
  );
};

Divider.displayName = 'Divider';

export { Divider };
