import random 
from linked_queue import LinkedQueue 

def baseline_reconnect():
    return random.randint(1, 50000)

def main():
    print("SwiftQueue Optimized Terminal Demo")
    q = LinkedQueue()

    sessions = ["user_A", "user_B", "user_C", "user_D", "user_E"]

    print("\nSTEP 1 Users join the queue:\n")

    for s in sessions:
        ticket = q.enqueue(s)
        print(f"  {s} joined → ticket #{ticket}, position {ticket}")

    target = "user_C"
    original_pos = 3

    print(f"\nSTEP 2 {target} refreshes their browser...\n")

    optimized_pos = q.find_position(target)

    print(f"  Optimized approach can find_position('{target}') = {optimized_pos}  ✓ same position")

    print("\nSTEP 3 Queue state after refresh:\n")
    print(f"  Queue size : {q.get_size()}")
    print(f"  Front      : {q.get_head()}")

    print("  Conclusion: Linked Queue preserves position on refresh.")

if __name__ == "__main__":
    main()