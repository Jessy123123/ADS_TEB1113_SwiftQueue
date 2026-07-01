# SwiftQueue: ADS TEB1113 (Algorithm and Data Structure)

**Before/after dashboard modeling Ticketmaster's 2022 Taylor Swift (Eras Tour) presale queue failure.**

Group project: SwiftQueue. This repo compares a naive ("baseline") virtual-queue design against a data-structure-driven ("optimized") redesign, using a Ticketmaster-styled interactive HTML dashboard with a live queue simulation.

## My scope (Eavan Tan)

**Optimized approach:** Linked Queue implemented in JavaScript inside `optimised.html`, with a live simulation showing enqueue, position assignment, refresh, and seat selection across 4 interactive screens.

Two approaches are compared, both built around a **single data structure choice**:

| | Baseline | Optimized |
|---|---|---|
| Structure | Array / flat list, random ticket assignment | Singly linked list used as a FIFO queue |
| Join queue | Random unique number, collision-checked against existing entries | Append to tail |
| Refresh/reconnect | Not supported: discards position, issues a new random number | Linear scan finds your node, restores your real position |
| Fairness | No: refreshing can improve your position, incentivizing spam-refresh | Yes: arrival order is preserved regardless of refresh |

Full problem narrative: [docs/PROBLEM_STATEMENT.md](docs/PROBLEM_STATEMENT.md)
Full design and Big-O breakdown: [docs/DESIGN_BASELINE_VS_OPTIMIZED.md](docs/DESIGN_BASELINE_VS_OPTIMIZED.md)

## Repo structure

```
ADS_TEB1113_SwiftQueue/
├── baseline_approach.html      # Baseline: 5 screens with navigation
├── optimised.html              # Optimized: 4 screens with live JS queue simulation
├── optimized/                  # Supporting Python terminal demos
│   ├── linked_queue.py         #   Node + LinkedQueue implementation
│   └── demo.py                 #   terminal walkthrough: join, refresh, position restored
└── docs/
    ├── PROBLEM_STATEMENT.md
    └── DESIGN_BASELINE_VS_OPTIMIZED.md
```

## How to run

Open `optimised.html` directly in a browser. No server or install required.

The simulation is fully self-contained in JavaScript inside the HTML file.

## Optimised flow

1. Landing Page — click Enter Virtual Waiting Room
2. Queue Page — add users to the linked queue, simulate a page refresh
3. Interruption Screen — watch find_position() restore your position automatically, then countdown to seat selection
4. Seat Selection — choose a section and proceed to checkout

## Design system

Ticketmaster style: white `#FFFFFF`, blue `#0067F4`, near-black `#1A1A1A`, gray `#6B7280`, Inter font.
The optimized flow has no Sold Out Modal by design: position is preserved on refresh so the user always reaches seat selection.
