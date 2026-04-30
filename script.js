import { searchStocks, getAllStocks, getStocksBySector, getStockById } from "./StockService.js";
import { addAlert, getAlerts, removeAlert, clearAllAlerts } from "./AlertService.js";
import { toggleFavorite, getFavorites } from "./FavoritesService.js";

const USER_ID = "demoUser";

const backToAllBtn = document.getElementById("backToAllBtn");
const pageTitle = document.getElementById("pageTitle");
const list = document.getElementById("stockList");
const detail = document.getElementById("detailView");
const listView = document.getElementById("listView");
const favoritesLink = document.getElementById("favoritesLink");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let currentDetailId = null;
let currentStocks = [];
let showingFavorites = false;
let currentSector = "All";

function getValueClass(value) {
  if (!value) return "";
  return String(value).startsWith("-") ? "negative" : "positive";
}

function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return "N/A";
  return `$${Number(price).toFixed(2)}`;
}

async function loadAndRenderStocks() {
  try {
    let stocks;

    if (showingFavorites) {
      const favoriteIds = await getFavorites(USER_ID);
      const allStocks = await getAllStocks();
      stocks = allStocks.filter((stock) =>
        favoriteIds.includes(stock.id) || favoriteIds.includes(stock.ticker)
      );
    } else if (currentSector !== "All") {
      stocks = await getStocksBySector(currentSector);
    } else {
      stocks = await getAllStocks();
    }

    currentStocks = stocks;
    renderStocks(stocks);
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p>Could not load stocks.</p>`;
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
        <button class="heart-btn" data-id="${stockId}" data-ticker="${stock.ticker}">♥</button>
      </div>
    `;

    list.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.onclick = () => showDetail(btn.dataset.id);
  });

  document.querySelectorAll(".heart-btn").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await toggleFavorite(USER_ID, btn.dataset.id, btn.dataset.ticker);
        await loadAndRenderStocks();
      } catch (err) {
        console.error(err);
      }
    };
  });
}

async function showDetail(stockId) {
  try {
    const stock = await getStockById(stockId);
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

    document.getElementById("detailReturn").textContent = stock.return ?? stock.changePercent ?? "N/A";
    document.getElementById("detailReturn").className = getValueClass(stock.return ?? stock.changePercent);

    document.getElementById("detailChange").textContent = stock.change ?? "N/A";
    document.getElementById("detailChange").className = getValueClass(stock.change);

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

  document.querySelectorAll(".remove-alert-btn").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await removeAlert(USER_ID, btn.dataset.id);
        const updatedAlerts = await getAlerts(USER_ID);
        renderAlerts(updatedAlerts);
      } catch (err) {
        console.error(err);
      }
    };
  });
}

document.getElementById("submitAlert").onclick = async () => {
  const tickerError = document.getElementById("tickerError");
  const priceError = document.getElementById("priceError");
  const formSuccess = document.getElementById("formSuccess");

  tickerError.textContent = "";
  priceError.textContent = "";
  formSuccess.textContent = "";

  try {
    await addAlert(USER_ID, {
      ticker: document.getElementById("alertTicker").value,
      price: document.getElementById("alertPrice").value,
      condition: document.getElementById("alertCondition").value,
      notify: document.getElementById("alertNotify").value
    });

    const alerts = await getAlerts(USER_ID);
    renderAlerts(alerts);

    document.getElementById("alertTicker").value = "";
    document.getElementById("alertPrice").value = "";
    formSuccess.textContent = "✓ Alert saved successfully.";

    setTimeout(() => {
      formSuccess.textContent = "";
    }, 3500);
  } catch (err) {
    const msg = err.message;

    if (msg.includes("Ticker") || msg.includes("ticker")) {
      tickerError.textContent = msg;
    } else if (msg.includes("Price") || msg.includes("price")) {
      priceError.textContent = msg;
    } else {
      formSuccess.textContent = msg;
    }

    console.error(err);
  }
};

document.getElementById("quickAlertBtn").onclick = async () => {
  const quickError = document.getElementById("quickAlertError");
  const quickSuccess = document.getElementById("quickAlertSuccess");

  quickError.textContent = "";
  quickSuccess.textContent = "";

  const stock = currentStocks.find((s) => (s.id || s.ticker) === currentDetailId);
  if (!stock) return;

  try {
    await addAlert(USER_ID, {
      ticker: stock.ticker,
      price: document.getElementById("quickAlertPrice").value,
      condition: document.getElementById("quickAlertCondition").value,
      notify: "email"
    });

    const alerts = await getAlerts(USER_ID);
    renderAlerts(alerts);

    document.getElementById("quickAlertPrice").value = "";
    quickSuccess.textContent = `✓ Alert saved for ${stock.ticker}.`;

    setTimeout(() => {
      quickSuccess.textContent = "";
    }, 3500);
  } catch (err) {
    quickError.textContent = err.message;
    console.error(err);
  }
};

document.getElementById("clearAlerts").onclick = async () => {
  try {
    await clearAllAlerts(USER_ID);
    renderAlerts([]);
  } catch (err) {
    console.error(err);
  }
};

favoritesLink.onclick = async (e) => {
  e.preventDefault();

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
    currentStocks = results;
    renderStocks(results);

    pageTitle.textContent = term === "" ? "My Stock Site" : `Search Results: ${term}`;
    backToAllBtn.style.display = term === "" ? "none" : "block";
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p>Search failed.</p>`;
  }
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
  await loadAndRenderStocks();

  try {
    const alerts = await getAlerts(USER_ID);
    renderAlerts(alerts);
  } catch (err) {
    console.error(err);
  }
}

init();