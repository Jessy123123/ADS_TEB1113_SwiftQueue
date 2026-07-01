class BaselineQueue {
    #requests = []; // private array
  
    #now() {
      return Date.now();
    } // private helper function
  
    enqueue(sessionId, userId, timestamp) {
      this.#requests.push({ sessionId, userId, timestamp }); // add user to the end of the array
    } // O(1)
  
    dequeue() {
      if (this.#requests.length === 0) {
        return { sessionId: "Empty", userId: "Empty", timestamp: -1 };
      }
  
      let minIndex = 0;
      for (let i = 1; i < this.#requests.length; i++) {
        if (this.#requests[i].timestamp < this.#requests[minIndex].timestamp) {
          minIndex = i;
        }
      }
  
      const removed = this.#requests[minIndex];
      this.#requests.splice(minIndex, 1);
      return removed;
    }
  
    handleRefresh(sessionId, userId) {
      this.enqueue(sessionId, userId, this.#now());
    }
  
    getPosition(sessionId) {
      for (let i = 0; i < this.#requests.length; i++) {
        if (this.#requests[i].sessionId === sessionId) {
          return i;
        }
      }
      return -1;
    }
  
    isEmpty() {
      return this.#requests.length === 0;
    }
  
    size() {
      return this.#requests.length;
    }
  
    printQueue() {
      console.log(`  Queue (${this.#requests.length} entries):`);
      for (let i = 0; i < this.#requests.length; i++) {
        console.log(
          `    [${i}] ${this.#requests[i].userId}  session: ${this.#requests[i].sessionId}  timestamp: ${this.#requests[i].timestamp}`
        );
      }
    }
  }
  
  const queue = new BaselineQueue();
  const sessionId = 'sess-' + Math.random().toString(36).slice(2, 9);
  const userId    = 'user-' + Math.random().toString(36).slice(2, 9);
  let userJoinTime;
  
  // Landing Page → user joins first, shown as #1
  document.querySelector('[data-pencil-name="Enter Queue Button"]')
    .addEventListener('click', () => {
      userJoinTime = Date.now();
  
      // User joins with the earliest timestamp — they are genuinely first
      queue.enqueue(sessionId, userId, userJoinTime);
  
      // Silently add simulated users with slightly later timestamps
      // So user stays at front, but refresh will push them behind all of these
      for (let i = 1; i <= 10; i++) {
        queue.enqueue(`bot-sess-${i}`, `bot-user-${i}`, userJoinTime + (i * 100));
      }
  
      // User is at position 0 (front) — display as #1
      document.querySelector('[data-pencil-name="Queue Number"]').textContent = '1';
      document.querySelector('[data-pencil-name="Progress Percent"]').textContent = 'Estimated wait: ~2 minutes';
  
      window.goTo(2);
    });
  
    document.querySelector('.queue-refresh-link')
    .addEventListener('click', () => {
      queue.handleRefresh(sessionId, userId);
  
      // Show worsened position on Interruption Screen
      document.querySelector('[data-pencil-name="Queue Preserved Note"]')
        .textContent = 'Your queue position: #300,701';
  
      window.goTo(3);
  
      // Countdown display
      const note = document.querySelector('[data-pencil-name="Queue Preserved Note"]');
      let countdown = 5;
  
      const timer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          note.textContent = `Your queue position: #300,701 — checking availability in ${countdown}s...`;
        } else {
          clearInterval(timer);
          window.goTo(5); // Tickets sold out — baseline failed to hold your spot
        }
      }, 1000);
    });

  // Interruption Screen → Seat Selection
  document.querySelector('[data-pencil-name="Refresh Button"]')
    .addEventListener('click', () => window.goTo(4));
  
  // Seat Selection → Sold Out
  document.querySelector('[data-pencil-name="Checkout Button"]')
    .addEventListener('click', () => window.goTo(5));
  
  // Sold Out → Landing
  document.querySelector('[data-pencil-name="Back Link"]')
    .addEventListener('click', () => window.goTo(1));