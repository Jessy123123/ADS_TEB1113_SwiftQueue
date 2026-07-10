class BaselineQueue {
  #requests = [];

  #now() {
    return Date.now();
  }

  enqueue(sessionId, userId, timestamp, ticketNumber) {
    this.#requests.push({ sessionId, userId, timestamp, ticketNumber });
  }

  hasTicketNumber(ticketNumber) {
    return this.#requests.some((r) => r.ticketNumber === ticketNumber);
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

  handleRefresh(sessionId, userId, ticketNumber) {
    this.enqueue(sessionId, userId, this.#now(), ticketNumber);
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

function generateUniqueTicketNumber(queue) {
  let candidate;
  do {
    candidate = Math.floor(100000 + Math.random() * 900000);
  } while (queue.hasTicketNumber(candidate));
  return candidate;
}

function formatTicketNumber(ticketNumber) {
  return typeof ticketNumber === "number"
    ? ticketNumber.toLocaleString("en-US")
    : ticketNumber;
}

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

function persistQueue(
  queue,
  sessionId,
  userId,
  userJoinTime,
  ticketNumber,
  previousTicketNumber
) {
  const existing = loadState() || {};
  saveState({
    ...existing,
    sessionId,
    userId,
    userJoinTime,
    ticketNumber,
    previousTicketNumber: previousTicketNumber ?? null,
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
    ticketNumber: state.ticketNumber,
    previousTicketNumber: state.previousTicketNumber ?? null,
  };
}

function isPageReload(pageKey) {
  const state = loadState();
  if (!state) return false;
  const visited = state.visitedPages || {};
  const wasVisited = !!visited[pageKey];
  saveState({ ...state, visitedPages: { ...visited, [pageKey]: true } });
  return wasVisited;
}

function reassignPosition(session) {
  const queue = getQueue();
  const newTicketNumber = generateUniqueTicketNumber(queue);
  queue.handleRefresh(session.sessionId, session.userId, newTicketNumber);
  persistQueue(
    queue,
    session.sessionId,
    session.userId,
    session.userJoinTime,
    newTicketNumber,
    session.ticketNumber
  );
  return newTicketNumber;
}

// Shared by every page that displays a position: a real browser reload
// lands here the same way a first visit does, so this is what tells them
// apart and reassigns on the reload path.
function sessionAfterReloadCheck(pageKey) {
  const session = getSession();
  if (session && isPageReload(pageKey)) {
    reassignPosition(session);
    return getSession();
  }
  return session;
}

function initEventDetail() {
  const btn = document.getElementById("enter-queue-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const sessionId = "sess-" + Math.random().toString(36).slice(2, 9);
    const userId = "user-" + Math.random().toString(36).slice(2, 9);
    const userJoinTime = Date.now();
    const queue = new BaselineQueue();

    const ticketNumber = generateUniqueTicketNumber(queue);
    queue.enqueue(sessionId, userId, userJoinTime, ticketNumber);

    for (let i = 1; i <= 10; i++) {
      const botTicketNumber = generateUniqueTicketNumber(queue);
      queue.enqueue(
        `bot-sess-${i}`,
        `bot-user-${i}`,
        userJoinTime + i * 100,
        botTicketNumber
      );
    }

    persistQueue(queue, sessionId, userId, userJoinTime, ticketNumber);
    window.location.href = "waiting-room.html";
  });
}

function initWaitingRoom() {
  const session = sessionAfterReloadCheck("waiting-room");
  const queueNumber = document.querySelector(".queue-number");
  const refreshBtn = document.getElementById("queue-refresh-btn");

  if (session && queueNumber) {
    queueNumber.textContent = formatTicketNumber(session.ticketNumber);
  }

  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", (event) => {
    event.preventDefault();

    const current = getSession();
    if (current) {
      reassignPosition(current);
    }

    window.location.href = "queue-interruption.html";
  });
}

function initQueueInterruption() {
  const session = sessionAfterReloadCheck("queue-interruption");
  const numberEl = document.getElementById("queue-position-number");
  const previousEl = document.getElementById("queue-position-previous");

  if (session && numberEl) {
    numberEl.textContent = "#" + formatTicketNumber(session.ticketNumber);
  }
  if (session && previousEl && session.previousTicketNumber != null) {
    previousEl.textContent =
      "Before the refresh, your number was #" +
      formatTicketNumber(session.previousTicketNumber) +
      ".";
  }

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
