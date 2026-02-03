'use client';

import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Show password toggle for password inputs */
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      success,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Determine state for styling
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            type={inputType}
            ref={ref}
            disabled={disabled}
            className={cn(
              // Base styles - Toss style
              'w-full h-12 px-4 text-base',
              'bg-gray-50 border rounded-xl',
              'text-gray-900 placeholder-gray-400',
              'transition-all duration-normal ease-toss',
              // Focus styles
              'focus:outline-none focus:bg-white',
              'focus:ring-2 focus:ring-offset-0',
              // State-based styles
              hasError
                ? 'border-error-DEFAULT focus:ring-error-DEFAULT/20 focus:border-error-DEFAULT'
                : hasSuccess
                ? 'border-success-DEFAULT focus:ring-success-DEFAULT/20 focus:border-success-DEFAULT'
                : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-900',
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
              // Padding adjustments for icons
              leftIcon && 'pl-10',
              (rightIcon || (isPassword && showPasswordToggle) || hasError || hasSuccess) && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Status Icons */}
            <AnimatePresence mode="wait">
              {hasError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-error-DEFAULT"
                >
                  <AlertCircle className="w-5 h-5" />
                </motion.div>
              )}
              {hasSuccess && !hasError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-success-DEFAULT"
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password Toggle */}
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !hasError && !hasSuccess && (
              <div className="text-gray-400">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper Text / Error Message */}
        <AnimatePresence mode="wait">
          {(error || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'mt-1.5 text-sm',
                hasError ? 'text-error-DEFAULT' : 'text-gray-500'
              )}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
