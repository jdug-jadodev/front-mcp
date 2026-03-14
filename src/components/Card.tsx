import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '', ariaLabel }) => {
  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-card p-6 max-w-sm w-full ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

export default Card
