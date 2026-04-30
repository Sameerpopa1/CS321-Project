import { getAllStocks, getStocksBySector, searchStocks, sortStocksAlphabetically } from "./services/StockService.js";
import { getFavorites, toggleFavorite } from "./services/FavoritesService.js";
import { validateAlertForm, addAlert, getAlerts, removeAlert, clearAllAlerts } from "./services/AlertService.js";

const USER_ID = "demo-user";
let allStocks = [];
let favoriteIds = new Set();
let currentDetailId = null;

const backToAllBtn = document.getElementById("backToAllBtn");
const pageTitle = document.getElementById("pageTitle");
const list = document.getElementById("stockList");
const detail = document.getElementById("detailView");
const listView = document.getElementById("listView");
const favoritesLink = document.getElementById("favoritesLink");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let showingFavorites = false;
let currentSector = "All";

function getValueClass(value) {
  return value.startsWith("-") ? "negative" : "positive";
}

function renderStocks(visibleStocks) {
  list.innerHTML = "";

  const sorted = sortStocksAlphabetically(visibleStocks);

  if (sorted.length === 0) {
    list.innerHTML = `<p>No stocks found.</p>`;
    return;
  }

  sorted.forEach((stock) => {
    const card = document.createElement("div");
    card.className = "stock-card";

    card.innerHTML = `
      <div class="stock-left">
        <h3>${stock.name}</h3>
        <p>${stock.ticker}</p>
      </div>
      <div class="stock-middle">
        <span class="price">$${Number(stock.price).toFixed(2)}</span>
        <span class="mini-label ${getValueClass(stock.return)}">${stock.return}</span>
      </div>
      <div class="card-actions">
        <button data-id="${stock.id}" class="view-btn">View Details</button>
        <button class="heart-btn ${favoriteIds.has(stock.id) ? "active" : ""}" data-id="${stock.id}" data-ticker="${stock.ticker}">♥</button>
      </div>
    `;

    list.appendChild(card);
  });

  list.querySelectorAll(".view-btn").forEach((btn) =>
    btn.addEventListener("click", () => showDetail(btn.dataset.id))
  );
  list.querySelectorAll(".heart-btn").forEach((btn) =>
    btn.addEventListener("click", () => handleToggleFavorite(btn.dataset.id, btn.dataset.ticker))
  );
}

async function handleToggleFavorite(stockId, ticker) {
  const nowFavorited = await toggleFavorite(USER_ID, stockId, ticker);
  if (nowFavorited) favoriteIds.add(stockId);
  else favoriteIds.delete(stockId);

  if (showingFavorites) {
    renderStocks(allStocks.filter((s) => favoriteIds.has(s.id)));
  } else if (currentSector !== "All") {
    const filtered = await getStocksBySector(currentSector);
    renderStocks(filtered);
  } else {
    renderStocks(allStocks);
  }
}

function showDetail(stockId) {
  const stock = allStocks.find((s) => s.id === stockId);
  if (!stock) return;
  currentDetailId = stockId;

  document.getElementById("detailName").textContent = stock.name;
  document.getElementById("detailTicker").textContent = stock.ticker;
  document.getElementById("quickAlertTicker").textContent = stock.ticker;
  document.getElementById("quickAlertPrice").value = "";
  document.getElementById("quickAlertError").textContent = "";
  document.getElementById("quickAlertSuccess").textContent = "";

  document.getElementById("currentPrice").textContent = `$${Number(stock.price).toFixed(2)}`;
  document.getElementById("investedPrice").textContent = `$${Number(stock.invest).toFixed(2)}`;
  document.getElementById("detailShares").textContent = stock.shares;
  document.getElementById("detailReturn").textContent = stock.return;
  document.getElementById("detailReturn").className = getValueClass(stock.return);
  document.getElementById("detailChange").textContent = stock.change;
  document.getElementById("detailChange").className = getValueClass(stock.change);
  document.getElementById("detailSector").textContent = stock.sector;
  document.getElementById("detailNote").textContent = stock.note;

  listView.style.display = "none";
  detail.classList.add("active");
}

document.getElementById("backBtn").onclick = () => {
  detail.classList.remove("active");
  listView.style.display = "block";
};

async function refreshAlertsBanner() {
  const alerts = await getAlerts(USER_ID);
  const banner = document.getElementById("alertsBanner");
  const alertsList = document.getElementById("alertsList");

  if (alerts.length === 0) {
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
      <span class="alert-condition">${alert.condition === "above" ? "↑" : "↓"} $${Number(alert.price).toFixed(2)}</span>
      <span class="alert-notify">${alert.notify}</span>
      <button class="remove-alert-btn" data-id="${alert.id}" type="button">✕</button>
    `;
    alertsList.appendChild(tag);
  });

  alertsList.querySelectorAll(".remove-alert-btn").forEach((btn) => {
    btn.onclick = async () => {
      await removeAlert(USER_ID, btn.dataset.id);
      await refreshAlertsBanner();
    };
  });
}

document.getElementById("clearAlerts").onclick = async () => {
  await clearAllAlerts(USER_ID);
  await refreshAlertsBanner();
};

document.getElementById("submitAlert").onclick = async () => {
  const tickerError = document.getElementById("tickerError");
  const priceError = document.getElementById("priceError");
  const formSuccess = document.getElementById("formSuccess");
  tickerError.textContent = "";
  priceError.textContent = "";
  formSuccess.textContent = "";

  const { errors, parsed } = validateAlertForm({
    ticker: document.getElementById("alertTicker").value,
    price: document.getElementById("alertPrice").value,
    condition: document.getElementById("alertCondition").value,
  });
  const notify = document.getElementById("alertNotify").value;

  if (errors.ticker) tickerError.textContent = errors.ticker;
  if (errors.price) priceError.textContent = errors.price;
  if (Object.keys(errors).length > 0) return;

  await addAlert(USER_ID, { ...parsed, notify });
  document.getElementById("alertTicker").value = "";
  document.getElementById("alertPrice").value = "";
  formSuccess.textContent = `✓ Alert set: ${parsed.ticker} ${parsed.condition} $${parsed.price.toFixed(2)} via ${notify}`;
  setTimeout(() => { formSuccess.textContent = ""; }, 3500);
  await refreshAlertsBanner();
};

document.getElementById("alertTicker").addEventListener("input", function () {
  const { errors } = validateAlertForm({ ticker: this.value, price: "1", condition: "above" });
  document.getElementById("tickerError").textContent = this.value.trim() ? (errors.ticker ?? "") : "";
});

document.getElementById("quickAlertBtn").onclick = async () => {
  const quickError = document.getElementById("quickAlertError");
  const quickSuccess = document.getElementById("quickAlertSuccess");
  quickError.textContent = "";
  quickSuccess.textContent = "";

  const stock = allStocks.find((s) => s.id === currentDetailId);
  if (!stock) return;

  const { errors, parsed } = validateAlertForm({
    ticker: stock.ticker,
    price: document.getElementById("quickAlertPrice").value,
    condition: document.getElementById("quickAlertCondition").value,
  });

  if (errors.price) { quickError.textContent = errors.price; return; }

  await addAlert(USER_ID, { ...parsed, notify: "email" });
  document.getElementById("quickAlertPrice").value = "";
  quickSuccess.textContent = `✓ Alert set for ${stock.ticker} ${parsed.condition} $${parsed.price.toFixed(2)}`;
  setTimeout(() => { quickSuccess.textContent = ""; }, 3500);
  await refreshAlertsBanner();
};

favoritesLink.onclick = (e) => {
  e.preventDefault();
  detail.classList.remove("active");
  listView.style.display = "block";
  showingFavorites = true;
  currentSector = "All";
  searchInput.value = "";
  pageTitle.textContent = "Favorite Stocks";
  backToAllBtn.style.display = "block";
  renderStocks(allStocks.filter((s) => favoriteIds.has(s.id)));
};

backToAllBtn.onclick = () => {
  showingFavorites = false;
  currentSector = "All";
  searchInput.value = "";
  pageTitle.textContent = "My Stock Site";
  backToAllBtn.style.display = "none";
  detail.classList.remove("active");
  listView.style.display = "block";
  renderStocks(allStocks);
};

const sectorLinks = document.querySelectorAll(".sectorLink");

sectorLinks.forEach((link) => {
  link.onclick = async (e) => {
    e.preventDefault();
    detail.classList.remove("active");
    listView.style.display = "block";
    showingFavorites = false;
    currentSector = link.dataset.sector;
    searchInput.value = "";
    pageTitle.textContent = currentSector + " Stocks";
    backToAllBtn.style.display = "block";
    const filtered = await getStocksBySector(currentSector);
    renderStocks(filtered);
  };
});

searchBtn.onclick = async () => {
  detail.classList.remove("active");
  listView.style.display = "block";
  showingFavorites = false;
  currentSector = "All";
  const term = searchInput.value.trim().toLowerCase();
  pageTitle.textContent = term === "" ? "My Stock Site" : `Search Results: ${searchInput.value}`;
  backToAllBtn.style.display = term === "" ? "none" : "block";
  const results = await searchStocks(term);
  renderStocks(results);
};

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

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

closeModalBtn.onclick = () => {
  contactModal.classList.remove("active");
};

contactModal.onclick = (e) => {
  if (e.target === contactModal) {
    contactModal.classList.remove("active");
  }
};

async function init() {
  try {
    allStocks = await getAllStocks();
    const favIds = await getFavorites(USER_ID);
    favoriteIds = new Set(favIds);
    await refreshAlertsBanner();
    renderStocks(allStocks);
  } catch (err) {
    console.error("Failed to initialize:", err);
    list.innerHTML = `<p>Error loading stocks. Check your Firebase config.</p>`;
  }
}

init();
