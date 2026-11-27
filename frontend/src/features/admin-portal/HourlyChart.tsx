import { useState } from 'react'

type Series = { label: string; color: string; values: number[] }

export function HourlyChart({ hours, series, max, unit = '' }: {
  hours: string[]
  series: Series[]
  max: number
  unit?: string
}) {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div className="min-w-0">
      <div className="relative flex h-44 min-w-0 items-end gap-1 border-b border-slate-200 pt-9 sm:gap-2" onPointerLeave={() => setActive(null)}>
        {active !== null && (
          <div role="status" className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg motion-safe:animate-[admin-tooltip-in_150ms_ease-out]">
            <strong>{hours[active]}</strong>
            {series.map(item => <span key={item.label} className="whitespace-nowrap">{item.label}: <strong>{item.values[active]}{unit}</strong></span>)}
          </div>
        )}
        {hours.map((hour, index) => (
          <button key={hour} type="button" aria-label={`${hour}, ${series.map(item => `${item.label} ${item.values[index]}${unit}`).join(', ')}`}
            onPointerEnter={() => setActive(index)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onClick={() => setActive(index)}
            className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 rounded-t-sm focus-visible:outline-2 focus-visible:outline-lime-600">
            {series.map(item => <span key={item.label} aria-hidden="true" className={`${item.color} ${active !== null && active !== index ? 'opacity-40' : 'opacity-100'} min-w-0 flex-1 rounded-t-sm transition-opacity duration-150 motion-reduce:transition-none`} style={{ height: `${Math.min(100, item.values[index] / max * 100)}%`, minHeight: item.values[index] > 0 ? 2 : 0 }} />)}
          </button>
        ))}
      </div>
      <div aria-hidden="true" className="mt-1 flex justify-between text-[11px] text-slate-500"><span>{hours[0]}</span><span>{hours[hours.length - 1]}</span></div>
    </div>
  )
}
