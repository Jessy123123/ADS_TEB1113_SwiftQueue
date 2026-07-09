class BaselineQueue {
  #requests = [];

  #now() {
    return Date.now();
  }

  enqueue(sessionId, userId, timestamp) {
    this.#requests.push({ sessionId, userId, timestamp });
  }

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

  toJSON() {
    return this.#requests;
  }

  static fromJSON(data) {
    const queue = new BaselineQueue();
    queue.#requests = Array.isArray(data) ? data : [];
    return queue;
  }
}

const STORAGE_KEY = "baselineQueueState";

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getQueue() {
  const state = loadState();
  return state ? BaselineQueue.fromJSON(state.queue) : new BaselineQueue();
}

function persistQueue(queue, sessionId, userId, userJoinTime) {
  saveState({
    sessionId,
    userId,
    userJoinTime,
    queue: queue.toJSON(),
  });
}

function getSession() {
  const state = loadState();
  if (!state) return null;
  return {
    sessionId: state.sessionId,
    userId: state.userId,
    userJoinTime: state.userJoinTime,
  };
}

function initEventDetail() {
  const btn = document.getElementById("enter-queue-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const sessionId = "sess-" + Math.random().toString(36).slice(2, 9);
    const userId = "user-" + Math.random().toString(36).slice(2, 9);
    const userJoinTime = Date.now();
    const queue = new BaselineQueue();

    queue.enqueue(sessionId, userId, userJoinTime);

    for (let i = 1; i <= 10; i++) {
      queue.enqueue(`bot-sess-${i}`, `bot-user-${i}`, userJoinTime + i * 100);
    }

    persistQueue(queue, sessionId, userId, userJoinTime);
    window.location.href = "waiting-room.html";
  });
}

function initWaitingRoom() {
  const session = getSession();
  const queueNumber = document.querySelector(".queue-number");
  const refreshBtn = document.getElementById("queue-refresh-btn");

  if (session && queueNumber) {
    queueNumber.textContent = "1";
  }

  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", (event) => {
    event.preventDefault();

    const session = getSession();
    if (session) {
      const queue = getQueue();
      queue.handleRefresh(session.sessionId, session.userId);
      persistQueue(
        queue,
        session.sessionId,
        session.userId,
        session.userJoinTime
      );
    }

    window.location.href = "queue-interruption.html";
  });
}

function initQueueInterruption() {
  const refreshBtn = document.getElementById("interruption-refresh-btn");
  const timerElement = document.getElementById("timer");
  let countdown = 5;

  if (timerElement) {
    timerElement.textContent = `checking availability in ${countdown}s...`;

    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        timerElement.textContent = `checking availability in ${countdown}s...`;
      } else {
        clearInterval(timer);
        window.location.href = "sold-out.html";
      }
    }, 1000);
  }

  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", () => {
    window.location.href = "seat-selection.html";
  });
}

function initSeatSelection() {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", () => {
    window.location.href = "sold-out.html";
  });
}

function initSoldOut() {
  const backLink = document.getElementById("back-to-event-link");
  if (!backLink) return;

  backLink.addEventListener("click", (event) => {
    event.preventDefault();
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = "event-detail.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  switch (page) {
    case "event-detail":
      initEventDetail();
      break;
    case "waiting-room":
      initWaitingRoom();
      break;
    case "queue-interruption":
      initQueueInterruption();
      break;
    case "seat-selection":
      initSeatSelection();
      break;
    case "sold-out":
      initSoldOut();
      break;
    default:
      break;
  }
});
