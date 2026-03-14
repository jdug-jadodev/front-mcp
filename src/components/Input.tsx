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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
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
  const inputType = type === 'password' && show ? 'text' : type

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={inputType}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-md border ${error ? 'border-red-500' : 'border-gray-200'} ${icon ? 'pl-10' : ''} focus:outline-none focus:ring-2 focus:ring-brand-primary-600 transition`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />

        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
          >
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
