interface Stat {
  label: string
  value: string | number
  // Tailwind class for the status dot; omitted for plain metrics
  dotClass?: string
}

interface StatsBarProps {
  stats: Stat[]
}

// Single-row overview strip: label and value inline, wraps on narrow screens
export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-border bg-card px-5 py-3.5">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-baseline gap-2">
          {stat.dotClass && <span className={`size-2.5 self-center rounded-full ${stat.dotClass}`} />}
          <span className="text-sm uppercase tracking-wide text-muted-foreground">{stat.label}</span>
          <span className="text-xl font-semibold tabular-nums">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}
