import { Link } from 'react-router-dom'

interface SyncFrameLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'admin'
  showText?: boolean
  subtitle?: 'STUDIO' | 'ADMIN CONSOLE' | null
  className?: string
  linkTo?: string | null
  theme?: 'light' | 'dark'
}

export default function SyncFrameLogo({
  size = 'md',
  showText = true,
  subtitle = null,
  className = '',
  linkTo = '/',
  theme = 'dark'
}: SyncFrameLogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    admin: 'w-9 h-9',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }

  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    admin: 'text-sm',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const subColor = theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'

  const icon = (
    <img
      src="/syncframe-app-icon.png"
      alt="SyncFrame Logo"
      className={`${sizeClasses[size]} object-contain flex-shrink-0`}
    />
  )

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-bold tracking-tight ${size === 'admin' ? 'leading-tight' : 'leading-none'} ${textSize[size]} ${textColor}`}>
            SyncFrame
          </span>
          {subtitle && (
            <span className={`${subColor} ${size === 'admin' ? 'text-[11px] font-semibold mt-0 tracking-wide' : 'text-[10px] font-bold tracking-widest mt-1'} uppercase leading-none`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-90 transition-opacity block">
        {content}
      </Link>
    )
  }

  return content
}
