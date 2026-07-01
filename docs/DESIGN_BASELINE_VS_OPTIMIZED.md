# Design: Baseline vs Optimized

Scope decision: **one data structure per approach**, no hybrid structures. Baseline uses an array/flat-list with random assignment. Optimized uses a singly linked list as a FIFO queue. No hashmap is used anywhere in this project: see "Known tradeoff" below for why that matters and why it's fine.

## Baseline design

- **Structure:** array (or equivalent flat list) of entries.
- **Join:** generate a random ticket number, check it against existing entries for a collision (must be unique), insert. The collision check is a scan over existing entries.
- **Reconnect/refresh:** not implemented. There is no lookup by identity: the session simply re-runs "join" and receives a new random number. This is O(1) *as an operation*, but it is the wrong operation: it silently discards the user's real position instead of restoring it.
- **Consequence:** fairness is not structurally guaranteed. Position is luck, and luck resets on every refresh.

## Optimized design

- **Structure:** singly linked list, used strictly as a queue (append at tail, remove from head).
- **Node fields:** `session_id`, `ticket_number` (or arrival index), `timestamp`, `next`.
- **`LinkedQueue` methods:**
  - `enqueue(session_id)`: append a new node at the tail. O(1).
  - `dequeue()`: remove and return the head node (user reaches the front / gets served). O(1).
  - `peek()`: return the head node without removing it. O(1).
  - `size()`: current count. O(1) if tracked with a counter field, O(n) if computed by walking the list. **Track a counter**, don't recompute.
  - `find_position(session_id)`: walk from head counting nodes until `session_id` matches; return the count (position) or `None`. O(n).
- **Reconnect/refresh:** call `find_position(session_id)`. Because the node was never removed, the user's real position is always what gets returned, so refreshing cannot change it.

### Why singly linked (not doubly) is enough

The only structural need here is: append at tail, remove at head, and walk-to-find on reconnect. None of these require relinking around a middle node, which is the one thing a doubly linked list would add. Don't add `prev` pointers: there's no operation in this design that uses them, so it would just be unused complexity in the report and the code.

## Big-O comparison

| Operation | Baseline | Optimized |
|---|---|---|
| Join queue | O(n): collision check against existing entries | O(1): append at tail |
| Serve next (dequeue) | O(1) or O(n) depending on array shift strategy | O(1): remove head |
| Reconnect / restore position | **Not supported** (re-randomizes instead) | O(n): linear scan by `session_id` |
| Fairness guarantee | None (random) | Structural (FIFO by construction) |

## Known tradeoff: be upfront about this in Chapter 4

Reconnect in the optimized design is O(n), not O(1). A hashmap keyed by `session_id → Node` would make it O(1), and it's worth one sentence in the report acknowledging that as the natural next optimization. But it is deliberately out of scope here: the project goal is to show that **choosing a queue over an array already fixes the fairness bug**, independent of any further lookup optimization. Framing it this way turns the limitation into an explicit, reasoned scope decision instead of an oversight.

## What `demo.py` needs to show

1. Several sessions call `enqueue`: print each one's assigned position.
2. Pick one session partway through the queue; simulate "refresh" by calling `find_position(session_id)` and print that it returns the *same* position as originally assigned.
3. Contrast: show what baseline would have done instead (re-randomize) for the same session, side by side, to make the fix visible in plain terminal output.

## What `benchmark.py` needs to measure

At queue sizes **100 / 1,000 / 10,000 / 100,000**, time two things and write both series to `results.json`:

1. **Join cost**: baseline's random-assign-with-collision-check vs optimized's `enqueue`. This is the O(n)-degrading-with-scale vs flat-O(1) chart.
2. **Reconnect cost**: baseline (not applicable / trivially O(1) because it does nothing correct) vs optimized's `find_position` (O(n), grows with size). Label this chart honestly: it shows optimized is *slower* here, but is the only one that's *correct*, and that's the point, not a weakness to hide.

Suggested `results.json` shape:

```json
{
  "sizes": [100, 1000, 10000, 100000],
  "join": { "baseline_ms": [...], "optimized_ms": [...] },
  "reconnect": { "baseline_ms": [...], "optimized_ms": [...] }
}
```

This is read client-side by Chart.js (CDN script tag, no build step) to render both charts on the dashboard.
