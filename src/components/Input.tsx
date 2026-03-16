import React, { useId, useState } from 'react'

export interface InputProps {
  label: string
  id?: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'tel' | 'number'
  placeholder?: string
  error?: string | null
  icon?: React.ReactNode
  showPasswordToggle?: boolean
  className?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      id,
      value,
      onChange,
      type = 'text',
      placeholder,
      error = null,
      icon,
      showPasswordToggle = false,
      className = '',
    },
    ref
  ) {
    const generatedId = useId()
    const inputId = id ?? `input-${generatedId}`
    const [show, setShow] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const inputType = type === 'password' && show ? 'text' : type

    return (
      <div className={`flex flex-col gap-2 w-full ${className}`}>
        <label 
          htmlFor={inputId} 
          className="text-sm font-medium text-slate-200 tracking-wide"
        >
          {label}
        </label>
        
        <div className="relative group">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-cyan-400">
              {icon}
            </span>
          )}
          
          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            type={inputType}
            placeholder={placeholder}
            className={`
              w-full
              px-4 py-3
              ${icon ? 'pl-12' : ''}
              rounded-xl
              bg-white/5
              backdrop-blur-sm
              border-2
              ${error 
                ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/50' 
                : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-500/50'
              }
              text-slate-50
              placeholder:text-slate-500
              focus:outline-none
              focus:ring-4
              transition-all
              duration-200
              ${error ? 'animate-shake' : ''}
              ${isFocused && !error ? 'glow-cyan' : ''}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />

          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-pressed={show}
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="
                absolute 
                right-4 
                top-1/2 
                -translate-y-1/2 
                text-sm 
                font-medium
                text-slate-400 
                hover:text-cyan-400
                transition-colors
                duration-200
                px-2
                py-1
                rounded
                hover:bg-white/5
              "
            >
              {show ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && (
          <p 
            id={`${inputId}-error`} 
            className="text-sm text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

export default Input
