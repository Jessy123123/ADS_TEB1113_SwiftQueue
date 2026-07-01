# Problem Statement

## What actually happened (Ticketmaster, 2022 Eras Tour presale)

Ticketmaster's "Verified Fan" presale let in far more people than the system could serve smoothly. Under that load, the virtual waiting room started throwing errors, and the standard advice — and the standard behavior — was to refresh the page. That single detail is the root of the failure: **refreshing did not restore your place in line.** It dropped you back into the entry pool and handed you a brand-new random position.

This is not a "the servers were too slow" story. It's a **data structure** story: the system had no durable, identity-indexed record of where a person stood, so it had no way to answer "has this person already joined, and where are they" — the only thing it could do on reconnect was start over.

## Why this makes the outage worse, not just unfair

Once people noticed that refreshing could hand them a *better* number than the one they already had, refreshing stopped being a fallback for errors and became a strategy for cutting the line. Everyone refreshing repeatedly multiplied load on a system that was already the bottleneck. The fairness bug and the performance bug are the same bug: **no restore-on-reconnect means both stability and fairness fail together.**

## The two concrete problems this project models

1. **Random-number entry, not ordered entry.** Baseline assigns each joining user a random ticket/position instead of a position determined by arrival order. There is no structural guarantee that "first to join" means "first to be served."
2. **No restore function on reconnect.** When a session drops (refresh, reconnect, network blip), baseline has no mechanism to find "this same user's" prior position — it just re-enters them at a new random point. This is what turns a technical hiccup into an incentive to game the system.

## Why the fix is a queue, not "more servers"

A **FIFO queue** structurally guarantees problem 1 is solved: whoever enqueues first is served first, by construction — not by chance. That alone removes the incentive to spam-refresh, because refreshing can no longer improve your position.

Problem 2 (restoring a specific user's position after a drop) requires some way to relate a session back to its place in the queue. In this project we solve it with a **linear scan through the linked queue** on reconnect — slower than a hashmap-backed lookup would be (see [DESIGN_BASELINE_VS_OPTIMIZED.md](DESIGN_BASELINE_VS_OPTIMIZED.md) for that tradeoff explicitly), but it is *correct*, which is the property baseline lacks entirely regardless of speed.

## Framing for the report

Lead with the incident, but land on the CS argument: this was fixable with the right choice of data structure, not just more infrastructure. The dashboard's job is to make that argument visible — baseline visibly breaks fairness on refresh, optimized visibly preserves it.
