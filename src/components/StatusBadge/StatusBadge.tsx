import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { NodeStatus } from '../../types/metrics'

const VARIANTS = {
  CRITICAL: 'destructive',
  WARNING: 'warning',
  OK: 'success',
} as const satisfies Record<NodeStatus, string>

// memo: the only prop is a string, so the badge re-renders only when the status changes
export const StatusBadge = memo(function StatusBadge({ status }: { status: NodeStatus }) {
  return <Badge variant={VARIANTS[status]}>{status}</Badge>
})
