import React from 'react'

interface DonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  strokeWidth?: number
  totalLabel?: string
}

export function DonutChart({ data, size = 100, strokeWidth = 12, totalLabel }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  let currentOffset = 0

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        {/* Data rings */}
        {data.map((item, i) => {
          if (total === 0) return null
          const dashArray = (item.value / total) * circumference
          const dashOffset = -currentOffset
          currentOffset += dashArray
          
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900 tracking-tight">{total > 0 ? total : 0}</span>
        {totalLabel && <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{totalLabel}</span>}
      </div>
    </div>
  )
}

interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export function ProgressRing({ value, max, size = 100, strokeWidth = 10, color = '#6366f1', label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const dashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-slate-900">{Math.round(percent)}%</span>
        {label && <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{label}</span>}
      </div>
    </div>
  )
}
