import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ariaLabel 
}) => {
  return (
    <div
      className={`
        glass-strong
        rounded-2xl 
        shadow-glass
        p-8
        sm:p-10
        max-w-md
        w-full
        border border-white/20
        transition-all
        duration-300
        hover:shadow-card-hover
        ${className}
      `}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

export default Card
