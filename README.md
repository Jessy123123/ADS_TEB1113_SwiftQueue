# SwiftQueue: ADS TEB1113 (Algorithm & Data Structure)

**Before/after dashboard modeling Ticketmaster's 2022 Taylor Swift (Eras Tour) presale queue failure.**

Group project: SwiftQueue. This repo compares a naive ("baseline") virtual-queue design against a data-structure-driven ("optimized") redesign, using both a Ticketmaster-styled HTML dashboard and a Python implementation with empirical benchmarks.

## My scope (Eavan Tan)

**Optimized approach:** Linked Queue (`optimized/queue.py`), demo walkthrough, benchmarking, and the optimized-side dashboard screens/navigation.

Two approaches are compared, both built around a **single data structure choice** (no hybrid structures: see [docs/DESIGN_BASELINE_VS_OPTIMIZED.md](docs/DESIGN_BASELINE_VS_OPTIMIZED.md) for why):

| | Baseline | Optimized |
|---|---|---|
| Structure | Array / flat list, random ticket assignment | Singly linked list used as a FIFO queue |
| Join queue | Random unique number, collision-checked against existing entries | Append to tail |
| Refresh/reconnect | **Not supported**: discards position, issues a new random number | Linear scan finds your node, restores your real position |
| Fairness | No: refreshing can improve your position, incentivizing spam-refresh | Yes: arrival order is preserved regardless of refresh |

Full problem narrative: [docs/PROBLEM_STATEMENT.md](docs/PROBLEM_STATEMENT.md)
Full design + Big-O breakdown: [docs/DESIGN_BASELINE_VS_OPTIMIZED.md](docs/DESIGN_BASELINE_VS_OPTIMIZED.md)
Presentation/demo script: [docs/PRESENTATION_SCRIPT.md](docs/PRESENTATION_SCRIPT.md)

## Repo structure

```
ADS_TEB1113_SwiftQueue/
├── baseline_approach.html      # 5 screens: Landing, Queue, Interruption, Seat Selection, Sold Out Modal
├── optimised.html              # currently 3 screens: Landing, Queue, Interruption (Seat Selection pending)
├── optimized/                  # Python implementation (not yet created)
│   ├── queue.py                #   Node + LinkedQueue: enqueue, dequeue, peek, size, find_position
│   ├── demo.py                 #   terminal walkthrough: join → ticket # → refresh → position restored
│   ├── benchmark.py            #   timing at 100/1k/10k/100k, writes results.json
│   └── results.json            #   benchmark output, charted in the dashboard via Chart.js
└── docs/
    ├── PROBLEM_STATEMENT.md
    ├── DESIGN_BASELINE_VS_OPTIMIZED.md
    └── PRESENTATION_SCRIPT.md
```

## Status / roadmap

- [ ] Add "4: Seat Selection" screen to `optimised.html`, fix mislabeled "BASELINE" badges → "OPTIMIZED: O(1)"
- [ ] Add JS navigation to `optimised.html` (Landing → Queue → Interruption → Seat Selection)
- [ ] Add JS navigation to `baseline_approach.html` (Landing → Queue → Interruption → random: Seat Selection OR Sold Out Modal)
- [ ] `optimized/queue.py`: `Node` + `LinkedQueue` (`enqueue`, `dequeue`, `peek`, `size`, `find_position`)
- [ ] `optimized/demo.py`: terminal walkthrough proving the fix
- [ ] `optimized/benchmark.py`: timing at 100/1k/10k/100k, saves `results.json`
- [ ] Wire `results.json` into a Chart.js chart on the dashboard
- [ ] Finalize PDF report Chapters 4 (Big-O + empirical) and 5 (Reflection)
- [ ] Push to GitHub with clean commit history

## Design system

Ticketmaster style: white `#FFFFFF`, blue `#0067F4`, near-black `#1A1A1A`, gray `#6B7280`, Inter font.
Badges: `BASELINE: O(n)` / `OPTIMIZED: O(1)`. The optimized flow has no Sold Out Modal by design: position is preserved on refresh, so there's nothing to lose.
