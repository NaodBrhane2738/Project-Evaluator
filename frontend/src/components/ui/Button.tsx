import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'danger' | 'ghost' | 'outline' | 'white'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const VARIANT: Record<Variant, React.CSSProperties> = {
  // Solid white — primary CTA
  white: {
    background: '#fff', color: '#000',
    border: '1px solid transparent',
    fontWeight: 700,
  },
  // White with hover darken
  primary: {
    background: '#fff', color: '#000',
    border: '1px solid transparent',
    fontWeight: 700,
  },
  // Glass danger
  danger: {
    background: 'rgba(248,113,113,0.08)',
    color: 'rgba(248,113,113,0.9)',
    border: '1px solid rgba(248,113,113,0.2)',
    fontWeight: 600,
  },
  // Frosted ghost
  ghost: {
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.08)',
    fontWeight: 500,
  },
  // Outline
  outline: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.15)',
    fontWeight: 500,
  },
}

const SIZE: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 13px', fontSize: '0.78rem', borderRadius: 9, gap: 6 },
  md: { padding: '9px 18px', fontSize: '0.85rem', borderRadius: 10, gap: 7 },
  lg: { padding: '13px 22px', fontSize: '0.92rem', borderRadius: 12, gap: 8 },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'outline', size = 'md', loading = false, icon, fullWidth = false, children, disabled, style, ...rest }, ref) => {
    const isDisabled = disabled || loading
    const isWhite = variant === 'primary' || variant === 'white'

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.45 : 1,
          transition: 'all 0.18s ease',
          fontFamily: 'inherit',
          width: fullWidth ? '100%' : undefined,
          ...VARIANT[variant],
          ...SIZE[size],
          ...style,
        }}
        onMouseEnter={e => {
          if (isDisabled) return
          const el = e.currentTarget
          if (isWhite)             { el.style.background = '#e5e5e5' }
          else if (variant === 'danger')  { el.style.background = 'rgba(248,113,113,0.14)' }
          else                     { el.style.background = 'rgba(255,255,255,0.09)'; el.style.color = '#fff' }
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          if (isDisabled) return
          const el = e.currentTarget
          if (isWhite)             { el.style.background = '#fff' }
          else if (variant === 'danger')  { el.style.background = 'rgba(248,113,113,0.08)' }
          else                     { el.style.background = VARIANT[variant].background as string; el.style.color = VARIANT[variant].color as string }
          el.style.transform = 'translateY(0)'
        }}
        onMouseDown={e => { if (!isDisabled) e.currentTarget.style.transform = 'scale(0.98)' }}
        onMouseUp={e => { if (!isDisabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
        {...rest}
      >
        {loading ? <Loader2 size={size === 'sm' ? 13 : size === 'lg' ? 17 : 15} className="anim-spin" /> : icon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
