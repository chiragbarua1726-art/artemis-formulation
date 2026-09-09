import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:translate-y-[0.5px]',
      secondary: 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/80',
      outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
      dark: 'bg-slate-900 hover:bg-black text-white shadow-sm',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs font-medium rounded-lg',
      md: 'h-10 px-4 text-sm font-medium rounded-xl',
      lg: 'h-12 px-6 text-base font-medium rounded-xl',
      icon: 'h-9 w-9 p-0 rounded-lg flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none font-sans',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
