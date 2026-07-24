class BaselineQueue {
  #requests = []; // unsorted array — O(n) for search, dequeue, getPosition

  #now() {
    return Date.now();
  }

  // O(1) — simply push to end, no ordering applied
  enqueue(sessionId, userId, timestamp, ticketNumber) {
    this.#requests.push({ sessionId, userId, timestamp, ticketNumber });
  }

  // O(n) — scans every element to check ticket uniqueness
  hasTicketNumber(ticketNumber) {
    return this.#requests.some((r) => r.ticketNumber === ticketNumber);
  }

  // O(n) — must scan entire array to find smallest timestamp (no sorted order)
  dequeue() {
    if (!this.#requests.length)
      return { sessionId: "Empty", userId: "Empty", timestamp: -1 };
    const minIndex = this.#requests.reduce(
      (min, r, i, arr) => (r.timestamp < arr[min].timestamp ? i : min), 0
    );
    return this.#requests.splice(minIndex, 1)[0];
  }

  // O(1) push — but user loses original position, treated as brand new arrival
  handleRefresh(sessionId, userId, ticketNumber) {
    this.enqueue(sessionId, userId, this.#now(), ticketNumber);
  }

  // O(n) — linear scan through entire array to find matching sessionId
  getPosition(sessionId) {
    return this.#requests.findIndex((r) => r.sessionId === sessionId);
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

// Storage helpers

const STORAGE_KEY = "baselineQueueState";

const storage = {
  get: () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); }
    catch { return null; }
  },
  set: (state) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)),
};

// Queue helpers

// O(n) — loops until a unique ticket number is found
function generateUniqueTicketNumber(queue) {
  let n;
  do { n = Math.floor(100000 + Math.random() * 900000); }
  while (queue.hasTicketNumber(n));
  return n;
}

function formatTicketNumber(n) {
  return typeof n === "number" ? n.toLocaleString("en-US") : n;
}

function getQueue() {
  const state = storage.get();
  return state ? BaselineQueue.fromJSON(state.queue) : new BaselineQueue();
}

function persistQueue(queue, sessionId, userId, userJoinTime, ticketNumber, previousTicketNumber = null) {
  storage.set({
    ...storage.get(),
    sessionId, userId, userJoinTime, ticketNumber,
    previousTicketNumber,
    queue: queue.toJSON(),
  });
}

function getSession() {
  const s = storage.get();
  return s ? {
    sessionId: s.sessionId,
    userId: s.userId,
    userJoinTime: s.userJoinTime,
    ticketNumber: s.ticketNumber,
    previousTicketNumber: s.previousTicketNumber ?? null,
  } : null;
}

function isPageReload(pageKey) {
  const state = storage.get();
  if (!state) return false;
  const visited = state.visitedPages || {};
  const wasVisited = !!visited[pageKey];
  storage.set({ ...state, visitedPages: { ...visited, [pageKey]: true } });
  return wasVisited;
}

// Refresh discards old position — assigns brand new random ticket number
function reassignPosition(session) {
  const queue = getQueue();
  const newTicketNumber = generateUniqueTicketNumber(queue);
  queue.handleRefresh(session.sessionId, session.userId, newTicketNumber);
  persistQueue(queue, session.sessionId, session.userId, session.userJoinTime, newTicketNumber, session.ticketNumber);
  return newTicketNumber;
}

function sessionAfterReloadCheck(pageKey) {
  const session = getSession();
  if (session && isPageReload(pageKey)) {
    reassignPosition(session);
    return getSession();
  }
  return session;
}

// DOM helper

function on(id, fn) {
  document.getElementById(id)?.addEventListener("click", fn);
}

// Page initialisers

function initEventDetail() {
  on("enter-queue-btn", () => {
    const sessionId = "sess-" + Math.random().toString(36).slice(2, 9);
    const userId    = "user-" + Math.random().toString(36).slice(2, 9);
    const userJoinTime = Date.now();
    const queue = new BaselineQueue();

    const ticketNumber = generateUniqueTicketNumber(queue);
    queue.enqueue(sessionId, userId, userJoinTime, ticketNumber);

    // Simulate 10 other users/bots joining after the real user
    for (let i = 1; i <= 10; i++) {
      queue.enqueue(`bot-sess-${i}`, `bot-user-${i}`, userJoinTime + i * 100, generateUniqueTicketNumber(queue));
    }

    persistQueue(queue, sessionId, userId, userJoinTime, ticketNumber);
    window.location.href = "waiting-room.html";
  });
}

function initWaitingRoom() {
  const session = sessionAfterReloadCheck("waiting-room");
  const queueNumber = document.querySelector(".queue-number");

  if (session && queueNumber)
    queueNumber.textContent = formatTicketNumber(session.ticketNumber);

  on("queue-refresh-btn", (e) => {
    e.preventDefault();
    const current = getSession();
    if (current) reassignPosition(current); // loses original position
    window.location.href = "queue-interruption.html";
  });
}

function initQueueInterruption() {
  const session   = sessionAfterReloadCheck("queue-interruption");
  const numberEl  = document.getElementById("queue-position-number");
  const previousEl = document.getElementById("queue-position-previous");

  if (session && numberEl)
    numberEl.textContent = "#" + formatTicketNumber(session.ticketNumber);

  if (session && previousEl && session.previousTicketNumber != null)
    previousEl.textContent =
      "Before the refresh, your number was #" +
      formatTicketNumber(session.previousTicketNumber) + ".";

  const timerEl = document.getElementById("timer");
  if (timerEl) {
    let countdown = 5;
    timerEl.textContent = `checking availability in ${countdown}s...`;
    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) { timerEl.textContent = `checking availability in ${countdown}s...`; }
      else { clearInterval(timer); window.location.href = "sold-out.html"; }
    }, 1000);
  }

  on("interruption-refresh-btn", () => window.location.href = "seat-selection.html");
}

function initSeatSelection() {
  on("checkout-btn", () => window.location.href = "sold-out.html");
}

function initSoldOut() {
  on("back-to-event-link", (e) => {
    e.preventDefault();
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = "event-detail.html";
  });
}

// Router

document.addEventListener("DOMContentLoaded", () => {
  ({
    "event-detail":       initEventDetail,
    "waiting-room":       initWaitingRoom,
    "queue-interruption": initQueueInterruption,
    "seat-selection":     initSeatSelection,
    "sold-out":           initSoldOut,
  }[document.body.dataset.page] || (() => {}))();
});