import time
import json
from linked_queue import LinkedQueue


def benchmark_join(sizes):
    results = []
    for n in sizes:
        q = LinkedQueue()
        start = time.perf_counter()
        # timer to record the current time in seconds 
        for i in range(n):
            q.enqueue(f"user_{i}")
        elapsed = (time.perf_counter() - start) * 1000
        results.append(round(elapsed, 4))
        print(f"  [join n={n}] {results[-1]}ms")
    return results


def benchmark_reconnect(sizes):
    results = []
    for n in sizes:
        q = LinkedQueue()
        for i in range(n):
            q.enqueue(f"user_{i}")
        target = f"user_{n - 1}"
        # use the last user to find the worst case for O(n)
        # because singly queue has to go through one by one
        start = time.perf_counter()
        q.find_position(target)
        elapsed = (time.perf_counter() - start) * 1000
        results.append(round(elapsed, 4))
        print(f"  [reconnect n={n}] {results[-1]}ms")
    return results


def main():
    sizes = [100, 1000, 10000, 100000]

    print("\nBenchmarking JOIN (enqueue)...")
    join_ms = benchmark_join(sizes)

    print("\nBenchmarking RECONNECT (find_position)...")
    reconnect_ms = benchmark_reconnect(sizes)

    results = {
        "sizes": sizes,
        "join_ms": join_ms,
        "reconnect_ms": reconnect_ms
    }

    with open("results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\nresults.json written.\n")


if __name__ == "__main__":
    main()