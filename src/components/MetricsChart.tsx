import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MetricDataPoint {
  timestamp: number
  cpu: number
  memory: number
  latency: number
}

interface MetricsChartProps {
  data: MetricDataPoint[]
  height?: number
}

export function MetricsChart({ data, height = 300 }: MetricsChartProps) {
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
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          stroke="var(--muted-foreground)"
          style={{ fontSize: '12px' }}
        />
        {/* Left axis: CPU and memory (percent), neutral color because two lines share it */}
        <YAxis
          yAxisId="percent"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          stroke="var(--muted-foreground)"
          style={{ fontSize: '12px' }}
        />
        {/* Right axis: latency (ms), tinted like the latency line, separate scale so the percent lines are not flattened */}
        <YAxis
          yAxisId="latency"
          orientation="right"
          tickFormatter={(value) => `${value}ms`}
          stroke="oklch(0.7 0.18 50)"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--popover-foreground)'
          }}
          labelFormatter={(label) => formatTime(Number(label))}
        />
        <Legend />
        <Line
          type="monotone"
          yAxisId="percent"
          dataKey="cpu"
          stroke="oklch(0.62 0.19 260)"
          name="CPU %"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          yAxisId="percent"
          dataKey="memory"
          stroke="oklch(0.7 0.17 150)"
          name="Memory %"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          yAxisId="latency"
          dataKey="latency"
          stroke="oklch(0.7 0.18 50)"
          name="Latency (ms)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
