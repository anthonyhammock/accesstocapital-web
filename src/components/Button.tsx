import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  type = 'button',
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClasses = 'font-inter font-medium px-8 py-3 rounded transition-all'
  
  const variantClasses = {
    primary: 'btn-primary hover:bg-opacity-90',
    secondary: 'btn-secondary hover:bg-navy hover:text-offwhite',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
