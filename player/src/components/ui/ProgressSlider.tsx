import { useRef, useCallback, type MouseEvent, type TouchEvent } from 'react'

interface ProgressSliderProps {
  value: number
  max: number
  onChange: (value: number) => void
  className?: string
}

export function ProgressSlider({ value, max, onChange, className = '' }: ProgressSliderProps) {
  const barRef = useRef<HTMLDivElement>(null)

  const calcValue = useCallback(
    (clientX: number) => {
      const bar = barRef.current
      if (!bar || max <= 0) return
      const rect = bar.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onChange(pct * max)
    },
    [max, onChange],
  )

  const handleMouse = (e: MouseEvent) => calcValue(e.clientX)
  const handleTouch = (e: TouchEvent) => {
    if (e.touches.length > 0) calcValue(e.touches[0].clientX)
  }

  const pct = max > 0 ? (value / max) * 100 : 0

  return (
    <div
      ref={barRef}
      className={`group relative h-6 flex items-center cursor-pointer ${className}`}
      onClick={handleMouse}
      onTouchMove={handleTouch}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="w-full h-1 group-hover:h-1.5 rounded-full bg-surface-overlay transition-all">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className="absolute w-3 h-3 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  )
}
