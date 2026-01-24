import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Button component with variants matching the design system.
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.fullWidth - Make button full width
 * @param {React.ReactNode} props.icon - Icon to show before text
 * @param {React.ReactNode} props.iconRight - Icon to show after text
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    iconRight,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const baseClasses = 'btn'
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    outline: 'btn-outline'
  }
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  }
  
  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth && 'w-full',
    className
  ].filter(Boolean).join(' ')
  
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
          {iconRight && <span className="btn-icon">{iconRight}</span>}
        </>
      )}
    </button>
  )
})

export default Button

// Named exports for convenience
export { Button }
