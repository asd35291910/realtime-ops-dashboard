interface MetricCardProps {
  label: string
  value: string
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="text-center p-4 bg-surface-subtle rounded-lg">
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}
