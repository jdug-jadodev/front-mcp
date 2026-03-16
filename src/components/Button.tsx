import React, { useEffect, useState } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return !!window.matchMedia('(prefers-reduced-motion: reduce)').matches
      }
    } catch {
      // ignore
    }
    return false
  })

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.matchMedia) return
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handle = (e: MediaQueryListEvent) => setPrefersReducedMotion(!!e.matches)
      const legacyHandle = () => setPrefersReducedMotion(!!mq.matches)
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handle)
      else if (typeof mq.addListener === 'function') mq.addListener(legacyHandle)
      return () => {
        if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handle)
        else if (typeof mq.removeListener === 'function') mq.removeListener(legacyHandle)
      }
    } catch {
      // noop
    }
  }, [])

  const baseClasses = `
    relative
    inline-flex 
    items-center 
    justify-center 
    px-6 
    py-3.5
    rounded-xl 
    font-semibold
    text-base
    min-w-[140px]
    overflow-hidden
    focus:outline-none
    focus:ring-4
    disabled:cursor-not-allowed
    transition-all
    duration-250
  `

  const motionClasses = prefersReducedMotion 
    ? '' 
    : 'hover:scale-[1.02] active:scale-[0.98]'

  const variantClasses =
    variant === 'primary'
      ? `
          bg-linear-to-r 
          from-cyan-500 
          via-purple-500 
          to-pink-500
          text-white
          shadow-card-modern
          hover:shadow-card-hover
          focus:ring-cyan-500/50
          disabled:opacity-60
          disabled:hover:scale-100
          ${!prefersReducedMotion ? 'hover:glow-cyan' : ''}
        `
      : `
          bg-transparent
          text-cyan-400
          border-2
          border-cyan-500/30
          hover:bg-cyan-500/10
          hover:border-cyan-400
          focus:ring-cyan-500/50
          ${motionClasses}
        `

  const spinnerClass = prefersReducedMotion 
    ? 'h-5 w-5 mr-2 text-white' 
    : 'animate-spin h-5 w-5 mr-2 text-white'

  return (
    <button
      className={`${baseClasses} ${variant === 'primary' ? variantClasses + ' ' + motionClasses : variantClasses} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {/* Gradient overlay on hover (primary only) */}
      {variant === 'primary' && !prefersReducedMotion && (
        <span className="absolute inset-0 bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-xl" />
      )}
      
      {/* Content */}
      <span className="relative flex items-center justify-center">
        {loading && (
          <svg 
            className={spinnerClass} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </span>
    </button>
  )
}

export default Button
