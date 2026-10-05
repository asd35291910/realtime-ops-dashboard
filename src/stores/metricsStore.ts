import { create } from 'zustand'
import type { NodeMetric, NodeStatus } from '../types/metrics'

interface MetricsState {
  nodes: NodeMetric[]
  lastUpdate: number
}

interface MetricsActions {
  setNodes: (nodes: NodeMetric[]) => void
  updateNode: (nodeId: string, updates: Partial<NodeMetric>) => void
  reset: () => void
}

type MetricsStore = MetricsState & MetricsActions

const initialState: MetricsState = {
  nodes: [],
  lastUpdate: 0,
}

export const useMetricsStore = create<MetricsStore>((set) => ({
  ...initialState,

  setNodes: (nodes) =>
    set({
      nodes,
      lastUpdate: Date.now(),
    }),

  updateNode: (nodeId, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.nodeId === nodeId ? { ...node, ...updates } : node
      ),
      lastUpdate: Date.now(),
    })),

  reset: () => set(initialState),
}))

// Selectores memoizados para evitar re-renders innecesarios
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

export const selectNodesByStatus = (status: NodeStatus) => (state: MetricsStore) =>
  state.nodes.filter((node) => node.status === status)
