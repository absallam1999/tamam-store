import { useEffect, useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { cn } from '@shared/utils/cn';

interface PageLoaderProps {
  variant?: 'fullscreen' | 'inline' | 'minimal';
  message?: string;
  messageAr?: string;
  messageEn?: string;
  className?: string;
  showDots?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * PageLoader — Professional Loading Component
 * 
 * Features:
 * - Multiple variants (fullscreen, inline, minimal)
 * - Bilingual support with auto-detection
 * - Smooth fade-in animation
 * - Customizable size
 * - Accessible with ARIA labels
 * - Dark/light mode support
 * - Reduced motion support
 */

const sizeConfig = {
  sm: {
    ring: 'w-10 h-10',
    border: 'border-2',
    dot: 'w-1.5 h-1.5',
    text: 'text-xs',
    bounceDot: 'w-1 h-1',
  },
  md: {
    ring: 'w-14 h-14 sm:w-16 sm:h-16',
    border: 'border-2',
    dot: 'w-2 h-2',
    text: 'text-sm',
    bounceDot: 'w-1.5 h-1.5',
  },
  lg: {
    ring: 'w-20 h-20 sm:w-24 sm:h-24',
    border: 'border-[3px]',
    dot: 'w-2.5 h-2.5',
    text: 'text-base',
    bounceDot: 'w-2 h-2',
  },
};

export const PageLoader: React.FC<PageLoaderProps> = ({
  variant = 'fullscreen',
  message,
  messageAr,
  messageEn,
  className,
  showDots = true,
  size = 'md',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { currentLanguage } = useLanguage();
  
  const isAr = currentLanguage === 'ar';

  // Auto-detect message based on language
  const displayMessage = 
    message || 
    (isAr 
      ? (messageAr || 'جاري التحميل...')
      : (messageEn || 'Loading...'));

  const sizes = sizeConfig[size];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const renderSpinner = () => (
    <div className="relative" aria-hidden="true">
      {/* Outer ring background */}
      <div className={cn(
        sizes.ring,
        'rounded-full',
        sizes.border,
        'border-surface-200 dark:border-surface-800'
      )} />
      
      {/* Spinning ring */}
      <div className={cn(
        'absolute inset-0',
        sizes.ring,
        'rounded-full',
        sizes.border,
        'border-transparent',
        'border-t-primary-500 dark:border-t-primary-400',
        'border-r-primary-500/30 dark:border-r-primary-400/30',
        'animate-spin motion-reduce:animate-none'
      )} />
      
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          sizes.dot,
          'rounded-full',
          'bg-primary-500 dark:bg-primary-400',
          'shadow-sm shadow-primary-500/30 dark:shadow-primary-400/30',
          'animate-pulse-soft'
        )} />
      </div>
    </div>
  );

  const renderDots = () => (
    <div className="flex gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            sizes.bounceDot,
            'rounded-full',
            'bg-primary-400 dark:bg-primary-500',
            'animate-bounce motion-reduce:animate-none'
          )}
          style={{ 
            animationDelay: `${i * 150}ms`, 
            animationDuration: '1.2s' 
          }}
        />
      ))}
    </div>
  );

  // Minimal variant: just spinner + message inline
  if (variant === 'minimal') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={displayMessage}
        className={cn(
          'inline-flex items-center gap-3 transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0',
          className
        )}
      >
        <div className="relative" aria-hidden="true">
          <div className={cn(
            'w-5 h-5 rounded-full',
            'border-2 border-surface-200 dark:border-surface-700',
            'border-t-primary-500 dark:border-t-primary-400',
            'animate-spin motion-reduce:animate-none'
          )} />
        </div>
        <span className="text-sm text-surface-600 dark:text-surface-400 font-medium">
          {displayMessage}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
      className={cn(
        'flex flex-col items-center justify-center gap-5 sm:gap-6',
        'transition-opacity duration-500 ease-out-expo',
        isVisible ? 'opacity-100' : 'opacity-0',
        variant === 'fullscreen' && cn(
          'fixed inset-0 z-50',
          'bg-surface-50/85 dark:bg-surface-950/85',
          'backdrop-blur-sm'
        ),
        variant === 'inline' && 'py-12 sm:py-16 md:py-20',
        className
      )}
    >
      {/* Spinner */}
      {renderSpinner()}

      {/* Text Content */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Main message */}
        <p className={cn(
          sizes.text,
          'font-medium',
          'text-surface-600 dark:text-surface-400',
          'text-center px-4'
        )}>
          {displayMessage}
        </p>
        
        {/* Bouncing dots */}
        {showDots && renderDots()}

        {/* Brand watermark - only on fullscreen */}
        {variant === 'fullscreen' && (
          <div className="mt-4 flex items-center gap-2 opacity-40">
            <img 
              src="/icon.svg" 
              alt="Tamam" 
              className="w-5 h-5 grayscale"
            />
          </div>
        )}
      </div>

      {/* Screen reader only */}
      <span className="sr-only">{displayMessage}</span>
    </div>
  );
};

/**
 * SkeletonLoader — Content placeholder for cards and sections
 */
export const SkeletonLoader: React.FC<{
  className?: string;
  lines?: number;
  variant?: 'text' | 'card' | 'avatar' | 'button';
}> = ({ className, lines = 3, variant = 'text' }) => {
  if (variant === 'card') {
    return (
      <div className={cn('glass p-5 space-y-4 animate-pulse', className)}>
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-full rounded-lg" />
        <div className="skeleton h-3 w-2/3 rounded-lg" />
        <div className="skeleton h-20 w-full rounded-xl mt-2" />
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-3 w-24 rounded-lg" />
          <div className="skeleton h-2 w-16 rounded-lg" />
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return <div className={cn('skeleton h-10 w-28 rounded-xl', className)} />;
  }

  // Default: text lines
  return (
    <div className={cn('space-y-2 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded-lg"
          style={{ width: `${100 - (i * 15)}%` }}
        />
      ))}
    </div>
  );
};

export default PageLoader;