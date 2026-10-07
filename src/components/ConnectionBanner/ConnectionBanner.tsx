import type { ConnectionStatus } from '../../hooks/useMetricsConnection'

// Shown only while there is no live connection, so stale data is never mistaken for live data
export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  if (status === 'connected') return null

  const lost = status === 'disconnected'
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
    >
      {lost ? 'Connection lost. Retrying…' : 'Connecting to the server…'}
    </div>
  )
}
