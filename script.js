import {
  searchStocks,
  getAllStocks,
  getStocksBySector,
  getStockById,
  addToWatchlist,
  removeFromWatchlist,
} from "./Stockservice.js";
import { addAlert, getAlerts, removeAlert, clearAllAlerts } from "./AlertService.js";
import { toggleFavorite, getFavorites } from "./FavoritesService.js";

const USER_STORAGE_KEY = "stockscope.userId";
const ALERT_POLL_MS = 60 * 1000;

// Sample data shown only when Firestore is empty (first run, before any stock has been added).
const sampleStocks = [
  { id: "TSLA", name: "Tesla", ticker: "TSLA", price: 175.50, changePercent: "-0.5%", sector: "Consumer", note: "Electric vehicle company." },
  { id: "JPM", name: "JPMorgan Chase", ticker: "JPM", price: 150.30, changePercent: "+0.3%", sector: "Finance", note: "Banking and financial services." },
  { id: "AAPL", name: "Apple Inc.", ticker: "AAPL", price: 190.25, changePercent: "+1.2%", sector: "Technology", note: "Technology company." },
  { id: "XOM", name: "ExxonMobil", ticker: "XOM", price: 105.75, changePercent: "-1.1%", sector: "Energy", note: "Energy and oil company." },
  { id: "PFE", name: "Pfizer", ticker: "PFE", price: 28.90, changePercent: "-0.7%", sector: "Healthcare", note: "Pharmaceutical company." },
  { id: "MSFT", name: "Microsoft", ticker: "MSFT", price: 420.10, changePercent: "+0.8%", sector: "Technology", note: "Software and cloud company." },
  { id: "NKE", name: "Nike", ticker: "NKE", price: 92.80, changePercent: "+0.6%", sector: "Consumer", note: "Sportswear and consumer brand." },
  { id: "BAC", name: "Bank of America", ticker: "BAC", price: 36.25, changePercent: "-0.2%", sector: "Finance", note: "Banking company." },
  { id: "CVX", name: "Chevron", ticker: "CVX", price: 158.40, changePercent: "+0.4%", sector: "Energy", note: "Energy company." },
  { id: "JNJ", name: "Johnson & Johnson", ticker: "JNJ", price: 152.60, changePercent: "+0.5%", sector: "Healthcare", note: "Healthcare products company." },
];

// DOM
const backToAllBtn = document.getElementById("backToAllBtn");
const pageTitle = document.getElementById("pageTitle");
const list = document.getElementById("stockList");
const detail = document.getElementById("detailView");
const listView = document.getElementById("listView");
const favoritesLink = document.getElementById("favoritesLink");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const userIndicator = document.getElementById("userIndicator");
const loginLink = document.getElementById("loginLink");
const loginModal = document.getElementById("loginModal");
const loginInput = document.getElementById("loginInput");
const loginError = document.getElementById("loginError");
const submitLoginBtn = document.getElementById("submitLoginBtn");
const closeLoginBtn = document.getElementById("closeLoginBtn");
const addStockInput = document.getElementById("addStockTicker");
const addStockBtn = document.getElementById("addStockBtn");
const addStockError = document.getElementById("addStockError");
const addStockSuccess = document.getElementById("addStockSuccess");
const toastContainer = document.getElementById("toastContainer");
const notifySelect = document.getElementById("alertNotify");

// State
let currentUserId = localStorage.getItem(USER_STORAGE_KEY);
let currentDetailId = null;
let currentStocks = [];
let currentFavoriteIds = new Set();
let showingFavorites = false;
let currentSector = "All";
// Alerts already fired this session - prevents duplicate toasts on every poll while still triggered.
const firedAlertIds = new Set();
let alertPollHandle = null;

function getValueClass(value) {
  if (!value) return "";
  return String(value).startsWith("-") ? "negative" : "positive";
}

function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return "N/A";
  return `$${Number(price).toFixed(2)}`;
}

// ---------- User session ----------

function refreshUserDisplay() {
  if (currentUserId) {
    userIndicator.textContent = currentUserId;
    loginLink.textContent = "Logout";
  } else {
    userIndicator.textContent = "Guest";
    loginLink.textContent = "Login";
  }
}

function openLoginModal() {
  loginError.textContent = "";
  loginInput.value = "";
  loginModal.classList.add("active");
  setTimeout(() => loginInput.focus(), 50);
}

function closeLoginModal() {
  loginModal.classList.remove("active");
}

loginLink.onclick = async (e) => {
  e.preventDefault();
  if (currentUserId) {
    currentUserId = null;
    localStorage.removeItem(USER_STORAGE_KEY);
    firedAlertIds.clear();
    refreshUserDisplay();
    await reloadAll();
  } else {
    openLoginModal();
  }
};

submitLoginBtn.onclick = async () => {
  const name = loginInput.value.trim();
  if (!name) {
    loginError.textContent = "Username is required.";
    return;
  }
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(name)) {
    loginError.textContent = "Use letters, numbers, _ or - (max 32).";
    return;
  }
  currentUserId = name;
  localStorage.setItem(USER_STORAGE_KEY, name);
  firedAlertIds.clear();
  closeLoginModal();
  refreshUserDisplay();
  await reloadAll();
};

closeLoginBtn.onclick = closeLoginModal;
loginModal.onclick = (e) => {
  if (e.target === loginModal) closeLoginModal();
};
loginInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitLoginBtn.click();
});

function requireUser(action = "do that") {
  if (!currentUserId) {
    showToast(`Please sign in to ${action}.`, "push", "Sign in required");
    openLoginModal();
    return false;
  }
  return true;
}

// ---------- Stocks list ----------

async function loadAndRenderStocks() {
  try {
    let stocks;

    if (showingFavorites) {
      const favoriteIds = await getFavorites(currentUserId);
      const allStocks = await getAllStocks();
      stocks = allStocks.filter((s) =>
        favoriteIds.includes(s.id) || favoriteIds.includes(s.ticker)
      );
    } else if (currentSector !== "All") {
      stocks = await getStocksBySector(currentSector);
      if (!stocks || stocks.length === 0) {
        stocks = sampleStocks.filter((s) => s.sector === currentSector);
      }
    } else {
      stocks = await getAllStocks();
      if (!stocks || stocks.length === 0) stocks = sampleStocks;
    }

    if (currentUserId) {
      try {
        const favIds = await getFavorites(currentUserId);
        currentFavoriteIds = new Set(favIds);
      } catch (err) {
        console.error("Failed to load favorites:", err);
        currentFavoriteIds = new Set();
      }
    } else {
      currentFavoriteIds = new Set();
    }

    currentStocks = stocks;
    renderStocks(stocks);
  } catch (err) {
    console.error(err);
    let fallback = sampleStocks;
    if (currentSector !== "All") {
      fallback = sampleStocks.filter((s) => s.sector === currentSector);
    }
    currentStocks = fallback;
    renderStocks(fallback);
  }
}

function renderStocks(stocks) {
  list.innerHTML = "";

  const sorted = [...stocks].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
  );

  if (sorted.length === 0) {
    list.innerHTML = `<p>No stocks found.</p>`;
    return;
  }

  sorted.forEach((stock) => {
    const stockId = stock.id || stock.ticker;
    const isFav = currentFavoriteIds.has(stockId) || currentFavoriteIds.has(stock.ticker);

    const card = document.createElement("div");
    card.className = "stock-card";
    card.innerHTML = `
      <div class="stock-left">
        <h3>${stock.name ?? stock.ticker}</h3>
        <p>${stock.ticker}</p>
      </div>

      <div class="stock-middle">
        <span class="price">${formatPrice(stock.price)}</span>
        <span class="mini-label ${getValueClass(stock.changePercent || stock.return)}">
          ${stock.changePercent ?? stock.return ?? "N/A"}
        </span>
      </div>

      <div class="card-actions">
        <button class="view-btn" data-id="${stockId}">View Details</button>
        <button class="heart-btn ${isFav ? "active" : ""}" data-id="${stockId}" data-ticker="${stock.ticker}" title="Toggle favorite">♥</button>
        <button class="delete-btn" data-id="${stockId}" data-ticker="${stock.ticker}" title="Remove from watchlist">✕</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".view-btn").forEach((btn) => {
    btn.onclick = () => showDetail(btn.dataset.id);
  });

  list.querySelectorAll(".heart-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!requireUser("save favorites")) return;
      const stockId = btn.dataset.id;
      const ticker = btn.dataset.ticker;
      try {
        const nowFav = await toggleFavorite(currentUserId, stockId, ticker);
        btn.classList.toggle("active", nowFav);
        if (nowFav) currentFavoriteIds.add(stockId);
        else currentFavoriteIds.delete(stockId);
        if (showingFavorites) await loadAndRenderStocks();
      } catch (err) {
        console.error(err);
        showToast(err.message, "push", "Favorite failed");
      }
    };
  });

  list.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = async () => {
      const stockId = btn.dataset.id;
      const ticker = btn.dataset.ticker || stockId;
      if (!confirm(`Remove ${ticker} from the watchlist?`)) return;
      try {
        await removeFromWatchlist(stockId);
        showToast(`${ticker} removed from watchlist.`, "push", "Watchlist");
        await loadAndRenderStocks();
      } catch (err) {
        console.error(err);
        showToast(err.message, "push", "Remove failed");
      }
    };
  });
}

async function showDetail(stockId) {
  try {
    let stock = await getStockById(stockId);
    if (!stock) stock = sampleStocks.find((s) => (s.id || s.ticker) === stockId);
    if (!stock) return;

    currentDetailId = stock.id || stock.ticker;

    document.getElementById("detailName").textContent = stock.name ?? stock.ticker;
    document.getElementById("detailTicker").textContent = stock.ticker;
    document.getElementById("quickAlertTicker").textContent = stock.ticker;
    document.getElementById("quickAlertPrice").value = "";
    document.getElementById("quickAlertError").textContent = "";
    document.getElementById("quickAlertSuccess").textContent = "";

    document.getElementById("currentPrice").textContent = formatPrice(stock.price);
    document.getElementById("investedPrice").textContent = stock.invest ? formatPrice(stock.invest) : "N/A";
    document.getElementById("detailShares").textContent = stock.shares ?? "N/A";

    const ret = stock.return ?? stock.changePercent ?? "N/A";
    const retEl = document.getElementById("detailReturn");
    retEl.textContent = ret;
    retEl.className = getValueClass(stock.return ?? stock.changePercent);

    const chgEl = document.getElementById("detailChange");
    chgEl.textContent = stock.change ?? "N/A";
    chgEl.className = getValueClass(stock.change);

    document.getElementById("detailSector").textContent = stock.sector ?? "N/A";
    document.getElementById("detailNote").textContent =
      stock.note ?? stock.description ?? "No company note available.";

    listView.style.display = "none";
    detail.classList.add("active");
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("backBtn").onclick = () => {
  detail.classList.remove("active");
  listView.style.display = "block";
};

// ---------- Add stock ----------

addStockBtn.onclick = async () => {
  addStockError.textContent = "";
  addStockSuccess.textContent = "";
  const ticker = (addStockInput.value || "").trim().toUpperCase();
  if (!ticker) {
    addStockError.textContent = "Ticker is required.";
    return;
  }
  addStockBtn.disabled = true;
  try {
    const stock = await addToWatchlist(ticker);
    addStockInput.value = "";
    addStockSuccess.textContent = `✓ ${stock.ticker} added.`;
    setTimeout(() => (addStockSuccess.textContent = ""), 3500);
    await loadAndRenderStocks();
  } catch (err) {
    addStockError.textContent = err.message;
  } finally {
    addStockBtn.disabled = false;
  }
};

addStockInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addStockBtn.click();
});

// ---------- Alerts ----------

function renderAlerts(alerts) {
  const banner = document.getElementById("alertsBanner");
  const alertsList = document.getElementById("alertsList");

  if (!alerts || alerts.length === 0) {
    banner.style.display = "none";
    return;
  }

  banner.style.display = "block";
  alertsList.innerHTML = "";

  alerts.forEach((alert) => {
    const tag = document.createElement("div");
    tag.className = "alert-tag";
    tag.innerHTML = `
      <span class="alert-ticker">${alert.ticker}</span>
      <span class="alert-condition">
        ${alert.condition === "above" ? "↑" : "↓"} ${formatPrice(alert.price)}
      </span>
      <span class="alert-notify">${alert.notify ?? "email"}</span>
      <button class="remove-alert-btn" data-id="${alert.id}" type="button">✕</button>
    `;
    alertsList.appendChild(tag);
  });

  alertsList.querySelectorAll(".remove-alert-btn").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await removeAlert(currentUserId, btn.dataset.id);
        firedAlertIds.delete(btn.dataset.id);
        const updated = await getAlerts(currentUserId);
        renderAlerts(updated);
      } catch (err) {
        console.error(err);
      }
    };
  });
}

document.getElementById("submitAlert").onclick = async () => {
  if (!requireUser("set alerts")) return;
  const tickerError = document.getElementById("tickerError");
  const priceError = document.getElementById("priceError");
  const formSuccess = document.getElementById("formSuccess");

  tickerError.textContent = "";
  priceError.textContent = "";
  formSuccess.textContent = "";

  const notify = document.getElementById("alertNotify").value;
  await ensureNotifyPermission(notify);

  try {
    await addAlert(currentUserId, {
      ticker: document.getElementById("alertTicker").value,
      price: document.getElementById("alertPrice").value,
      condition: document.getElementById("alertCondition").value,
      notify,
    });

    const alerts = await getAlerts(currentUserId);
    renderAlerts(alerts);

    document.getElementById("alertTicker").value = "";
    document.getElementById("alertPrice").value = "";
    formSuccess.textContent = "✓ Alert saved successfully.";
    setTimeout(() => (formSuccess.textContent = ""), 3500);

    checkAlerts();
  } catch (err) {
    const msg = err.message;
    if (msg.includes("Ticker") || msg.includes("ticker")) tickerError.textContent = msg;
    else if (msg.includes("Price") || msg.includes("price")) priceError.textContent = msg;
    else formSuccess.textContent = msg;
    console.error(err);
  }
};

document.getElementById("quickAlertBtn").onclick = async () => {
  if (!requireUser("set alerts")) return;
  const quickError = document.getElementById("quickAlertError");
  const quickSuccess = document.getElementById("quickAlertSuccess");
  quickError.textContent = "";
  quickSuccess.textContent = "";

  const stock = currentStocks.find((s) => (s.id || s.ticker) === currentDetailId);
  if (!stock) return;

  try {
    await addAlert(currentUserId, {
      ticker: stock.ticker,
      price: document.getElementById("quickAlertPrice").value,
      condition: document.getElementById("quickAlertCondition").value,
      notify: "email",
    });
    const alerts = await getAlerts(currentUserId);
    renderAlerts(alerts);

    document.getElementById("quickAlertPrice").value = "";
    quickSuccess.textContent = `✓ Alert saved for ${stock.ticker}.`;
    setTimeout(() => (quickSuccess.textContent = ""), 3500);

    checkAlerts();
  } catch (err) {
    quickError.textContent = err.message;
    console.error(err);
  }
};

document.getElementById("clearAlerts").onclick = async () => {
  try {
    await clearAllAlerts(currentUserId);
    firedAlertIds.clear();
    renderAlerts([]);
  } catch (err) {
    console.error(err);
  }
};

// ---------- Notifications ----------

async function ensureNotifyPermission(channel) {
  if (channel !== "push") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch (err) { console.error(err); }
  }
}

notifySelect?.addEventListener("change", () => ensureNotifyPermission(notifySelect.value));

function showToast(message, channel = "push", title = "Alert") {
  if (!toastContainer) return;
  const el = document.createElement("div");
  el.className = `toast toast-${channel}`;
  el.innerHTML = `
    <div class="toast-channel">${channel.toUpperCase()} · ${title}</div>
    <div class="toast-body"></div>
  `;
  el.querySelector(".toast-body").textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 6000);
  el.onclick = () => el.remove();
}

function dispatchNotification(alert, currentPrice) {
  const direction = alert.condition === "above" ? "rose above" : "fell below";
  const msg = `${alert.ticker} ${direction} ${formatPrice(alert.price)} (now ${formatPrice(currentPrice)})`;
  const channel = alert.notify ?? "email";

  showToast(msg, channel, "Price alert");

  if (channel === "push" && "Notification" in window && Notification.permission === "granted") {
    try { new Notification("StockScope alert", { body: msg }); } catch (err) { console.error(err); }
  } else if (channel === "email" || channel === "sms") {
    // No backend mailer is wired up, so surface dispatch in the console for testing.
    console.info(`[${channel.toUpperCase()} would be sent]`, msg);
  }
}

async function checkAlerts() {
  if (!currentUserId) return;
  let alerts;
  try {
    alerts = await getAlerts(currentUserId);
  } catch (err) {
    console.error("Failed to load alerts for polling:", err);
    return;
  }

  const liveIds = new Set(alerts.map((a) => a.id));
  for (const id of [...firedAlertIds]) {
    if (!liveIds.has(id)) firedAlertIds.delete(id);
  }

  for (const alert of alerts) {
    try {
      const stock = await getStockById(alert.ticker);
      const price = stock?.price;
      if (price == null || isNaN(price)) continue;

      const target = Number(alert.price);
      const meets =
        (alert.condition === "above" && price >= target) ||
        (alert.condition === "below" && price <= target);

      if (meets && !firedAlertIds.has(alert.id)) {
        firedAlertIds.add(alert.id);
        dispatchNotification(alert, price);
      } else if (!meets) {
        firedAlertIds.delete(alert.id);
      }
    } catch (err) {
      console.error(`Alert check failed for ${alert.ticker}:`, err);
    }
  }
}

// ---------- Navigation ----------

favoritesLink.onclick = async (e) => {
  e.preventDefault();
  if (!requireUser("view favorites")) return;
  detail.classList.remove("active");
  listView.style.display = "block";
  showingFavorites = true;
  currentSector = "All";
  searchInput.value = "";
  pageTitle.textContent = "Favorite Stocks";
  backToAllBtn.style.display = "block";
  await loadAndRenderStocks();
};

backToAllBtn.onclick = async () => {
  showingFavorites = false;
  currentSector = "All";
  searchInput.value = "";
  pageTitle.textContent = "My Stock Site";
  backToAllBtn.style.display = "none";
  detail.classList.remove("active");
  listView.style.display = "block";
  await loadAndRenderStocks();
};

document.querySelectorAll(".sectorLink").forEach((link) => {
  link.onclick = async (e) => {
    e.preventDefault();
    detail.classList.remove("active");
    listView.style.display = "block";
    showingFavorites = false;
    currentSector = link.dataset.sector;
    searchInput.value = "";
    pageTitle.textContent = currentSector + " Stocks";
    backToAllBtn.style.display = "block";
    await loadAndRenderStocks();
  };
});

searchBtn.onclick = async () => {
  const term = searchInput.value.trim();
  detail.classList.remove("active");
  listView.style.display = "block";
  showingFavorites = false;
  currentSector = "All";

  try {
    const results = await searchStocks(term);
    currentStocks = (results && results.length > 0)
      ? results
      : sampleStocks.filter((s) =>
          s.name.toLowerCase().includes(term.toLowerCase()) ||
          s.ticker.toLowerCase().includes(term.toLowerCase()),
        );
    renderStocks(currentStocks);
  } catch (err) {
    console.error(err);
    const lc = term.toLowerCase();
    currentStocks = lc
      ? sampleStocks.filter((s) => s.name.toLowerCase().includes(lc) || s.ticker.toLowerCase().includes(lc))
      : sampleStocks;
    renderStocks(currentStocks);
  }

  pageTitle.textContent = term === "" ? "My Stock Site" : `Search Results: ${term}`;
  backToAllBtn.style.display = term === "" ? "none" : "block";
};

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// ---------- Contact modal ----------

const contactLink = document.getElementById("contactLink");
const footerContactLink = document.getElementById("footerContactLink");
const contactModal = document.getElementById("contactModal");
const closeModalBtn = document.getElementById("closeModalBtn");

function openContactModal(e) {
  e.preventDefault();
  contactModal.classList.add("active");
}

contactLink.onclick = openContactModal;
footerContactLink.onclick = openContactModal;
closeModalBtn.onclick = () => contactModal.classList.remove("active");
contactModal.onclick = (e) => {
  if (e.target === contactModal) contactModal.classList.remove("active");
};

// ---------- Init ----------

async function reloadAll() {
  await loadAndRenderStocks();
  if (currentUserId) {
    try {
      const alerts = await getAlerts(currentUserId);
      renderAlerts(alerts);
      checkAlerts();
    } catch (err) {
      console.error(err);
      renderAlerts([]);
    }
  } else {
    renderAlerts([]);
  }
}

async function init() {
  refreshUserDisplay();
  await reloadAll();
  if (alertPollHandle) clearInterval(alertPollHandle);
  alertPollHandle = setInterval(checkAlerts, ALERT_POLL_MS);
}

init();
