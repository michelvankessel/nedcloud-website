'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    const hasError = !!error;
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          suppressHydrationWarning
          className={cn(
            'w-full px-4 py-3 bg-dark-800/50 border border-dark-600 rounded-lg',
            'text-gray-100 placeholder:text-gray-500',
            'focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50',
            'transition-all duration-200',
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {hasError && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'