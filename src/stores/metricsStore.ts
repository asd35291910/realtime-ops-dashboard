import { create } from 'zustand'
import type { NodeMetric } from '../types/metrics'

interface MetricsState {
  nodes: NodeMetric[]
}

interface MetricsActions {
  setNodes: (nodes: NodeMetric[]) => void
  reset: () => void
}

type MetricsStore = MetricsState & MetricsActions

const initialState: MetricsState = {
  nodes: [],
}

export const useMetricsStore = create<MetricsStore>((set) => ({
  ...initialState,

  setNodes: (nodes) =>
    set((state) => {
      // JSON.parse creates new objects for every node. The server only bumps the
      // timestamp of nodes that were measured again, so reuse the previous object
      // when it matches: memoized rows can then skip unchanged nodes.
      const previous = new Map(state.nodes.map((node) => [node.nodeId, node]))
      const merged = nodes.map((node) => {
        const prev = previous.get(node.nodeId)
        return prev && prev.timestamp === node.timestamp ? prev : node
      })

      return { nodes: merged }
    }),

  reset: () => set(initialState),
}))

// Selectors return primitives: Zustand skips the re-render when the value is unchanged
export const selectCriticalCount = (state: MetricsStore) =>
  state.nodes.filter((node) => node.status === 'CRITICAL').length

export const selectWarningCount = (state: MetricsStore) =>
  state.nodes.filter((node) => node.status === 'WARNING').length

export const selectOkCount = (state: MetricsStore) =>
  state.nodes.filter((node) => node.status === 'OK').length

export const selectActiveNodes = (state: MetricsStore) => state.nodes.length

export const selectAverageLatency = (state: MetricsStore) => {
  if (state.nodes.length === 0) return 0
  const total = state.nodes.reduce((sum, node) => sum + node.latency, 0)
  return Math.round(total / state.nodes.length)
}

export const selectAverageCpu = (state: MetricsStore) => {
  if (state.nodes.length === 0) return 0
  const total = state.nodes.reduce((sum, node) => sum + node.cpu, 0)
  return Math.round(total / state.nodes.length)
}

export const selectAverageMemory = (state: MetricsStore) => {
  if (state.nodes.length === 0) return 0
  const total = state.nodes.reduce((sum, node) => sum + node.memory, 0)
  return Math.round(total / state.nodes.length)
}
