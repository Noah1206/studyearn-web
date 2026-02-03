'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  /** Enable motion animations */
  animated?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      animated = false,
      children,
      ...props
    },
    ref
  ) => {
    // Toss-style variants with soft shadows
    const variants = {
      default: 'bg-white shadow-toss-2',
      elevated: 'bg-white shadow-toss-4',
      outlined: 'bg-white border border-gray-200',
      filled: 'bg-gray-50',
    };

    // Toss-style paddings
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
      xl: 'p-6',
    };

    const baseClasses = cn(
      'rounded-xl',
      variants[variant],
      paddings[padding],
      hoverable && !animated && 'transition-all duration-normal ease-toss hover:shadow-toss-4 hover:-translate-y-0.5 cursor-pointer',
      className
    );

    // Motion variants for hover effect
    const motionVariants = {
      rest: {
        scale: 1,
        y: 0,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      hover: {
        scale: 1.01,
        y: -4,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.06)',
      },
    };

    if (animated || (hoverable && animated !== false)) {
      return (
        <motion.div
          ref={ref}
          className={cn(baseClasses, 'cursor-pointer')}
          variants={motionVariants}
          initial="rest"
          whileHover="hover"
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card subcomponents with Toss styling
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 pb-3', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-gray-900 tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 gap-3', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
