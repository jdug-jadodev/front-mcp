import React from 'react'

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
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium'
  const style =
    variant === 'primary'
      ? 'bg-brand-primary-600 text-white hover:bg-brand-primary-700 disabled:opacity-60 shadow-sm transition transform hover:-translate-y-0.5'
      : 'bg-transparent text-brand-primary-600 border border-transparent hover:bg-brand-primary-50'

  return (
    <button className={`${base} ${style} ${className}`} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
