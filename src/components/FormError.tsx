import React from 'react'

export interface FormErrorProps {
  message?: string | null
  className?: string
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null
  return (
    <div role="alert" className={`bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm ${className}`}>
      {message}
    </div>
  )
}

export default FormError
