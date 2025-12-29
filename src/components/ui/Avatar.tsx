import { forwardRef, type ImgHTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height' | 'src'> {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = 'md', fallback, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-24 h-24 text-2xl',
    };

    const sizeValues = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
      '2xl': 96,
    };

    // Get initials from alt text or fallback
    const getInitials = () => {
      const text = fallback || alt;
      return text
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center',
          sizes[size],
          className
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={sizeValues[size]}
            height={sizeValues[size]}
            className="object-cover w-full h-full"
            {...props}
          />
        ) : (
          <span className="font-medium text-gray-600">{getInitials()}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
