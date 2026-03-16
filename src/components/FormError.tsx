import React from 'react'

export interface FormErrorProps {
  message?: string | null
  className?: string
}

export const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  function FormError({ message, className = '' }, ref) {
    if (!message) return null
    
    return (
      <div
        ref={ref}
        role="alert"
        tabIndex={-1}
        className={`
          glass
          bg-rose-500/10
          border-2
          border-rose-500/30
          text-rose-300
          px-4
          py-3
          rounded-xl
          text-sm
          flex
          items-start
          gap-3
          animate-in
          fade-in
          slide-in-from-top-2
          duration-300
          ${className}
        `}
      >
        <svg 
          className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>
        <span className="flex-1">{message}</span>
      </div>
    )
  }
)

export default FormError
