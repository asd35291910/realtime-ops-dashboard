import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MetricDataPoint } from '../../types/metrics'

interface MetricsChartProps {
  data: MetricDataPoint[]
}

// Fills its parent: the height comes from the parent (--chart-height token)
export function MetricsChart({ data }: MetricsChartProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          stroke="var(--muted-foreground)"
          style={{ fontSize: 'var(--text-chart-axis)' }}
        />
        {/* Left axis: CPU and memory (percent), neutral color because two lines share it */}
        <YAxis
          yAxisId="percent"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          stroke="var(--muted-foreground)"
          style={{ fontSize: 'var(--text-chart-axis)' }}
        />
        {/* Right axis: latency (ms), tinted like the latency line, separate scale so the percent lines are not flattened */}
        <YAxis
          yAxisId="latency"
          orientation="right"
          tickFormatter={(value) => `${value}ms`}
          stroke="var(--chart-3)"
          style={{ fontSize: 'var(--text-chart-axis)' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--chart-tooltip-radius)',
            color: 'var(--popover-foreground)'
          }}
          labelFormatter={(label) => formatTime(Number(label))}
        />
        <Legend />
        <Line
          type="monotone"
          yAxisId="percent"
          dataKey="cpu"
          stroke="var(--chart-1)"
          name="CPU %"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          yAxisId="percent"
          dataKey="memory"
          stroke="var(--chart-2)"
          name="Memory %"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          yAxisId="latency"
          dataKey="latency"
          stroke="var(--chart-3)"
          name="Latency (ms)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
