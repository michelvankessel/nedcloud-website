'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  children: ReactNode
  iconLeft?: ReactNode
  iconRight?: ReactNode
  isLoading?: boolean
}

export const Button = ({
  variant = 'primary',
  children,
  iconLeft,
  iconRight,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses =
    'px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-neon-blue text-white hover:bg-neon-blue/90 active:bg-neon-blue/80',
    secondary:
      'bg-dark-600 text-white hover:bg-dark-500 active:bg-dark-400 border border-dark-400',
    ghost: 'text-white hover:bg-dark-600/50 active:bg-dark-600/30',
    danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-400',
  }

  const buttonClasses = cn(
    baseClasses,
    variants[variant],
    {
      'opacity-50 cursor-not-allowed': disabled || isLoading,
      'cursor-wait': isLoading,
    },
    className
  )

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled || isLoading}
      className={buttonClasses}
      {...props}
    >
      {iconLeft && <span>{iconLeft}</span>}
      {isLoading ? 'Loading...' : children}
      {iconRight && <span>{iconRight}</span>}
    </motion.button>
  )
}