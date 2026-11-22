export type IconName =
  | 'dashboard'
  | 'vehicles'
  | 'reservation'
  | 'packages'
  | 'history'
  | 'settings'
  | 'bell'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'menu'
  | 'close'
  | 'search'
  | 'plus'
  | 'minus'

type IconProps = {
  name: IconName
  className?: string
}

export function Icon({ name, className = 'size-5' }: IconProps) {
  const common = {
    'aria-hidden': true as const,
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  }

  switch (name) {
    case 'dashboard':
      return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></svg>
    case 'vehicles':
      return <svg {...common}><path d="m5 11 1.6-4.3A2.5 2.5 0 0 1 9 5h6a2.5 2.5 0 0 1 2.4 1.7L19 11" /><path d="M4 11h16v7H4z" /><path d="M7 18v1.5M17 18v1.5M4 14h2m12 0h2" /><circle cx="7.5" cy="14.5" r=".5" /><circle cx="16.5" cy="14.5" r=".5" /></svg>
    case 'reservation':
      return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3.5v3M16 3.5v3M4 9h16M8 13h3M8 16h6" /></svg>
    case 'packages':
      return <svg {...common}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H20v14H6.5A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 8h16M15 12h5v4h-5a2 2 0 0 1 0-4Z" /><circle cx="15" cy="14" r=".5" /></svg>
    case 'history':
      return <svg {...common}><path d="M3.5 12a8.5 8.5 0 1 0 2.2-5.7L3.5 8.5" /><path d="M3.5 4.5v4h4M12 7.5V12l3 2" /></svg>
    case 'settings':
      return <svg {...common}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="18" r="2" /></svg>
    case 'bell':
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
    case 'chevron-left':
      return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
    case 'chevron-right':
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>
    case 'chevron-down':
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>
    case 'menu':
      return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    case 'close':
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>
    case 'search':
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></svg>
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
    case 'minus':
      return <svg {...common}><path d="M5 12h14" /></svg>
  }

  return null
}
