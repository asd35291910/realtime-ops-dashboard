# Architecture

## Overview

```
Mock server        snapshot of every node, every 500 ms
   │ WebSocket
   ▼
WebSocketClient    connects and retries
   ▼
MetricsWebSocketService   parses the JSON
   ▼
Zustand store      latest snapshot
   ▼
Hooks              filter, sort, selection, history
   ▼
Components         render
```

The server sends a full snapshot of every node every 500 ms. The browser keeps the latest snapshot in a store, and the UI derives everything else from it.

## Architecture decisions and state strategy

- **Server data lives in one Zustand store; UI state lives next to the UI.** The store only holds the node snapshot. Filter and sort are `useState` in `App`, and the selected node is in `useNodeSelection`. The client never edits a node, so the store has a single write: `setNodes`.
- **Layers with one job each.** `WebSocketClient` is transport (connect, exponential backoff from 1 s to 10 s). `MetricsWebSocketService` is protocol (parse a snapshot). The store is state. Components only render. Business logic sits in hooks and services, not in JSX.
- **Stable references for unchanged nodes.** `JSON.parse` creates new objects for every node on every snapshot, which would defeat `React.memo`. The server only changes a node's `timestamp` when that node is measured again, so `setNodes` reuses the previous object when the timestamp matches. Rows are memoized (`NodeRow`, `StatusBadge`), so only rows whose node changed re-render. This relies on that contract between server and client.
- **Selectors return primitives.** Counts and averages are plain functions over the node list. They are not cached; Zustand skips the re-render when the returned number is unchanged. `MetricsOverview` and `NodeFilters` read their own selectors, so `App` does not re-render when a count changes.
- **The chart history stores readings, not ticks.** `useNodeHistory` keeps the last 20 readings of the selected node and adds one only when the node actually changed. The chart waits for two readings, since one point cannot draw a line. Closing the detail clears the history.
- **Strict TypeScript, no `any`.** Shared types live in `src/types/metrics.ts`.

## Performance

Measured with a production build, 1500 nodes, Chrome with 4x CPU throttling, in a private window without extensions, over 10 seconds.

| Main thread time | Plain list | Virtualized (with or without memoized rows) |
| ---------------- | ---------- | ------------------------------------------- |
| Painting         | 3385 ms    | 19–37 ms                                    |
| Rendering        | 1671 ms    | 33–52 ms                                    |
| Scripting        | 854 ms     | 154–196 ms                                  |

The bottleneck was the browser painting and laying out 1500 rows, not React. Virtualization (`@tanstack/react-virtual`) keeps about 30 rows in the DOM and removed almost all of that cost, so it came first. The virtualized column comes from three recordings, one without memoized rows and two with them.

The differences between those recordings are within the noise between runs (tens of milliseconds), so the table does not claim that memoization changed painting or rendering. Memoization lowered scripting slightly (196 ms in the one run without it, 154–161 ms in the two with it). Its main value is that only the rows whose node changed re-render.

Filtering and sorting run on the full list (not only the visible rows), so a sort by CPU is a real ranking of all nodes. This costs O(n log n) per snapshot, which did not show up as a bottleneck at 1500 nodes.

## Design system

- **Tokens** in `src/index.css`: palette (light and dark, following the OS), status colors (`success`, `warning`, `destructive`), chart colors, row and surface colors derived from `--muted`, and layout values (list height, modal height, chart height, z-index layers).
- **Primitives** in `src/components/ui/` (Badge, Button, Select, MetricCard, StatsBar) use those tokens and `cva` variants. Feature components (NodeList, NodeDetail, ...) compose them.

## Testing

- **Unit and component tests (Vitest + React Testing Library):** store, hooks, WebSocket client (fake socket and timers), data generator, node list, and the main user flows in `App`. Tests check what the user sees (rows, dialog, buttons), not implementation details.
- **E2E (Cypress):** filter by CRITICAL, inspect a node's telemetry (including a live update and closing with Escape). They use a fake WebSocket with fixed data so they are deterministic. One extra test uses the real mock server.

## Trade-offs made for the 2-day limit

- **Mock server instead of a real backend.** It simulates nodes, incidents and recoveries; it is not meant to be production code.
- **Full snapshots.** Simple and robust, but wasteful when few nodes change (see below).
- **Sorting and aggregates are computed in the browser.**
- **Input latency was not measured with a separate number.** Frames stayed stable at the 500 ms update rate during the recordings.
- **Light theme is less polished than the dark one.**
- **Docker:** the server image installs dev dependencies, because the mock server runs with `tsx`, `express` and `ws`, which are dev dependencies. A production backend would ship compiled code only.

## Scaling to 10,000+ nodes

Today the browser receives every node on every update. That works for hundreds or a few thousand nodes, but not for tens of thousands, so the work should move to the server and the client should only ask for what it shows.

1. **Paginate by windows, with the server sorting and filtering.** The client asks for a window of the list (for example nodes 4000 to 4999, sorted by CPU, filtered by CRITICAL) instead of all nodes. The server has to do the sorting and filtering because only it has every node. As the user scrolls, the virtualized list asks for the next window.
2. **Send only changes, only for the visible window.** The client subscribes to the window it is showing, and the server pushes just the nodes of that window that changed, instead of a full snapshot.
3. **Compute the overview on the server.** The counters (total, critical, averages) cannot be calculated in the browser once it no longer holds every node, so they arrive already computed.
4. **Batch updates per frame.** Messages are collected and applied once per screen redraw (`requestAnimationFrame`), instead of redrawing for every message.
5. **Parse in a Web Worker.** Turning large JSON messages into objects can freeze the page, so it can be done in a separate thread.

Rendering cost does not grow with the number of nodes, because the list is already virtualized.
