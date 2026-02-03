'use client';

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  type SelectHTMLAttributes,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      error,
      helperText,
      placeholder = '선택하세요',
      value,
      onChange,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync with external value
    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle selection
    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    // Get selected option label
    const selectedOption = options.find((opt) => opt.value === selectedValue);

    const hasError = !!error;

    return (
      <div className="w-full" ref={containerRef}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}

        {/* Hidden native select for form submission */}
        <select
          ref={ref}
          value={selectedValue}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={disabled}
          className="sr-only"
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom select trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full h-12 px-4 text-left text-base',
              'bg-gray-50 border rounded-xl',
              'transition-all duration-normal ease-toss',
              'flex items-center justify-between gap-2',
              'focus:outline-none focus:bg-white focus:ring-2 focus:ring-offset-0',
              hasError
                ? 'border-error-DEFAULT focus:ring-error-DEFAULT/20 focus:border-error-DEFAULT'
                : isOpen
                ? 'bg-white border-gray-900 ring-2 ring-gray-900/20'
                : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-900',
              disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
              className
            )}
          >
            <span
              className={cn(
                'truncate',
                selectedOption ? 'text-gray-900' : 'text-gray-400'
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                className={cn(
                  'absolute z-50 w-full mt-1',
                  'bg-white rounded-xl shadow-toss-4 border border-gray-100',
                  'py-1 max-h-60 overflow-auto'
                )}
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm',
                      'flex items-center justify-between',
                      'transition-colors duration-fast',
                      option.disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : option.value === selectedValue
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span>{option.label}</span>
                    {option.value === selectedValue && (
                      <Check className="w-4 h-4 text-orange-500" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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

Select.displayName = 'Select';

export { Select };
