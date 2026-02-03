'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Enable motion animations */
  animated?: boolean;
  /** Inline styles */
  style?: React.CSSProperties;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      animated = true,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Toss-style variants
    const variants = {
      primary: [
        'bg-gray-900 text-white',
        'hover:bg-gray-800',
        'active:bg-gray-700',
        'shadow-toss-2 hover:shadow-toss-3',
        'focus-visible:ring-gray-900/30',
      ].join(' '),
      secondary: [
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'active:bg-gray-300',
        'focus-visible:ring-gray-400/30',
      ].join(' '),
      outline: [
        'border border-gray-200 bg-white text-gray-700',
        'hover:bg-gray-50 hover:border-gray-300',
        'active:bg-gray-100',
        'focus-visible:ring-gray-400/30',
      ].join(' '),
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100',
        'active:bg-gray-200',
        'focus-visible:ring-gray-400/30',
      ].join(' '),
      danger: [
        'bg-error-DEFAULT text-white',
        'hover:bg-error-dark',
        'active:opacity-90',
        'focus-visible:ring-error-DEFAULT/30',
      ].join(' '),
      success: [
        'bg-success-DEFAULT text-white',
        'hover:bg-success-dark',
        'active:opacity-90',
        'focus-visible:ring-success-DEFAULT/30',
      ].join(' '),
      link: [
        'bg-transparent text-gray-900',
        'hover:text-gray-700 hover:underline',
        'p-0 h-auto',
      ].join(' '),
    };

    // Toss-style sizes with proper padding
    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-12 px-5 text-base rounded-xl gap-2',
      xl: 'h-14 px-6 text-base rounded-xl gap-2.5',
    };

    const isDisabled = disabled || isLoading;

    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-fast ease-toss',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    );

    // Motion variants for press effect
    const motionVariants = {
      rest: { scale: 1 },
      hover: { scale: 1.02 },
      tap: { scale: 0.97 },
    };

    const buttonContent = (
      <>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </>
    );

    if (animated && !isDisabled) {
      return (
        <motion.button
          ref={ref}
          disabled={isDisabled}
          className={baseClasses}
          variants={motionVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          {...(props as HTMLMotionProps<'button'>)}
        >
          {buttonContent}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={baseClasses}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
