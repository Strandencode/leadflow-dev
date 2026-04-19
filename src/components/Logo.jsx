/**
 * Vekstor logo system — three variants
 *
 *   <Logo variant="light" />     full lockup on Canvas ground
 *   <Logo variant="dark"  />     full lockup on Ink ground
 *   <Mark variant="ink"   />     arcs only (24pt default)
 *
 * Rendered via <img> so the SVG source (in public/brand/) stays the
 * single source of truth — no duplicated path data in JS.
 */
export function Logo({ variant = 'light', className = '', height = 28 }) {
  const src = variant === 'dark' ? '/brand/vekstor-logo-dark.svg' : '/brand/vekstor-logo-light.svg'
  return (
    <img src={src} alt="Vekstor AI" height={height} style={{ height, width: 'auto' }} className={className} draggable={false} />
  )
}

export function Mark({ variant = 'ink', className = '', size = 28 }) {
  const src = {
    ink:  '/brand/vekstor-icon-ink.svg',
    sage: '/brand/vekstor-icon-sage.svg',
    dark: '/brand/vekstor-mark-dark.svg',
    light:'/brand/vekstor-mark-light.svg',
    lg:   '/brand/vekstor-mark-lg-dark.svg',
  }[variant] || '/brand/vekstor-icon-ink.svg'
  return (
    <img src={src} alt="" height={size} width={size} style={{ height: size, width: size }} className={className} draggable={false} />
  )
}

export default Logo
