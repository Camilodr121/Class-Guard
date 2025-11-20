// frontend/src/components/ui/Badge.tsx
import { ReactNode } from 'react';
import { components, helpers } from '@/lib/design-tokens';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}: BadgeProps) {
  const variantClasses = {
    success: components.badge.success,
    warning: components.badge.warning,
    error: components.badge.error,
    info: components.badge.info,
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 border',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={helpers.cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
