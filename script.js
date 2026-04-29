const backToAllBtn = document.getElementById("backToAllBtn");
const pageTitle = document.getElementById("pageTitle");

let activeAlerts = [];
let currentDetailIndex = null;

const list = document.getElementById("stockList");
const detail = document.getElementById("detailView");
const listView = document.getElementById("listView");
const favoritesLink = document.getElementById("favoritesLink");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const stocks = [
  { name: "A", ticker: "AAA", price: 100.25, invest: 800, shares: 5, return: "+10.4%", change: "+1.3%", sector: "Technology", note: "Sample stock A.", favorite: false },
  { name: "B", ticker: "BBB", price: 214.80, invest: 1500, shares: 6, return: "-3.2%", change: "-0.8%", sector: "Energy", note: "Sample stock B.", favorite: false },
  { name: "C", ticker: "CCC", price: 58.40, invest: 300, shares: 4, return: "+5.1%", change: "+0.6%", sector: "Healthcare", note: "Sample stock C.", favorite: false },
  { name: "D", ticker: "DDD", price: 142.35, invest: 950, shares: 7, return: "+2.8%", change: "+0.4%", sector: "Finance", note: "Sample stock D.", favorite: false },
  { name: "E", ticker: "EEE", price: 76.90, invest: 620, shares: 8, return: "-1.7%", change: "-0.3%", sector: "Consumer", note: "Sample stock E.", favorite: false },
  { name: "F", ticker: "FFF", price: 188.10, invest: 1200, shares: 6, return: "+7.6%", change: "+1.1%", sector: "Technology", note: "Sample stock F.", favorite: false },
  { name: "G", ticker: "GGG", price: 39.75, invest: 400, shares: 10, return: "-4.5%", change: "-0.9%", sector: "Energy", note: "Sample stock G.", favorite: false },
  { name: "H", ticker: "HHH", price: 251.60, invest: 1800, shares: 7, return: "+12.2%", change: "+2.0%", sector: "Healthcare", note: "Sample stock H.", favorite: false },
  { name: "I", ticker: "III", price: 91.45, invest: 700, shares: 8, return: "+3.9%", change: "+0.7%", sector: "Finance", note: "Sample stock I.", favorite: false },
  { name: "J", ticker: "JJJ", price: 67.20, invest: 500, shares: 7, return: "-2.6%", change: "-0.5%", sector: "Consumer", note: "Sample stock J.", favorite: false },
  { name: "K", ticker: "KKK", price: 305.15, invest: 2100, shares: 6, return: "+15.0%", change: "+2.4%", sector: "Technology", note: "Sample stock K.", favorite: false },
  { name: "L", ticker: "LLL", price: 48.85, invest: 350, shares: 7, return: "-6.1%", change: "-1.2%", sector: "Energy", note: "Sample stock L.", favorite: false },
  { name: "M", ticker: "MMM", price: 129.50, invest: 1000, shares: 8, return: "+4.2%", change: "+0.9%", sector: "Healthcare", note: "Sample stock M.", favorite: false },
  { name: "N", ticker: "NNN", price: 84.30, invest: 760, shares: 9, return: "+1.8%", change: "+0.2%", sector: "Finance", note: "Sample stock N.", favorite: false },
  { name: "O", ticker: "OOO", price: 173.95, invest: 1300, shares: 7, return: "-0.9%", change: "-0.1%", sector: "Consumer", note: "Sample stock O.", favorite: false },
  { name: "P", ticker: "PPP", price: 226.40, invest: 1600, shares: 7, return: "+8.7%", change: "+1.5%", sector: "Technology", note: "Sample stock P.", favorite: false },
  { name: "Q", ticker: "QQQ", price: 33.60, invest: 280, shares: 8, return: "-5.4%", change: "-1.0%", sector: "Energy", note: "Sample stock Q.", favorite: false },
  { name: "R", ticker: "RRR", price: 118.75, invest: 900, shares: 7, return: "+6.3%", change: "+1.0%", sector: "Healthcare", note: "Sample stock R.", favorite: false },
  { name: "S", ticker: "SSS", price: 97.05, invest: 850, shares: 9, return: "-1.1%", change: "-0.2%", sector: "Finance", note: "Sample stock S.", favorite: false },
  { name: "T", ticker: "TTT", price: 62.45, invest: 520, shares: 8, return: "+2.5%", change: "+0.3%", sector: "Consumer", note: "Sample stock T.", favorite: false },
  { name: "U", ticker: "UUU", price: 199.99, invest: 1400, shares: 7, return: "+9.4%", change: "+1.7%", sector: "Technology", note: "Sample stock U.", favorite: false },
  { name: "V", ticker: "VVV", price: 44.25, invest: 330, shares: 7, return: "-3.8%", change: "-0.6%", sector: "Energy", note: "Sample stock V.", favorite: false },
  { name: "W", ticker: "WWW", price: 156.70, invest: 1100, shares: 7, return: "+5.9%", change: "+0.8%", sector: "Healthcare", note: "Sample stock W.", favorite: false },
  { name: "X", ticker: "XXX", price: 88.88, invest: 720, shares: 8, return: "-2.0%", change: "-0.4%", sector: "Finance", note: "Sample stock X.", favorite: false },
  { name: "Y", ticker: "YYY", price: 134.20, invest: 980, shares: 7, return: "+3.4%", change: "+0.5%", sector: "Consumer", note: "Sample stock Y.", favorite: false },
  { name: "Z", ticker: "ZZZ", price: 269.30, invest: 1900, shares: 7, return: "+11.8%", change: "+1.9%", sector: "Technology", note: "Sample stock Z.", favorite: false }
];

let showingFavorites = false;
let currentSector = "All";
let searchTerm = "";

function getValueClass(value) {
  return value.startsWith("-") ? "negative" : "positive";
}

function renderStocks() {
  list.innerHTML = "";

  let visibleStocks = stocks;

  if (showingFavorites) {
    visibleStocks = visibleStocks.filter(stock => stock.favorite);
  }

  if (currentSector !== "All") {
    visibleStocks = visibleStocks.filter(stock => stock.sector === currentSector);
  }

  if (searchTerm !== "") {
    visibleStocks = visibleStocks.filter(stock =>
      stock.name.toLowerCase() === searchTerm ||
      stock.ticker.toLowerCase() === searchTerm ||
      stock.sector.toLowerCase() === searchTerm
    );
  }

  visibleStocks = visibleStocks.slice().sort((a, b) => a.name.localeCompare(b.name));

  if (visibleStocks.length === 0) {
    list.innerHTML = `<p>No stocks found.</p>`;
    return;
  }

  visibleStocks.forEach((stock) => {
    const realIndex = stocks.indexOf(stock);

    const card = document.createElement("div");
    card.className = "stock-card";

    card.innerHTML = `
      <div class="stock-left">
        <h3>${stock.name}</h3>
        <p>${stock.ticker}</p>
      </div>

      <div class="stock-middle">
        <span class="price">$${stock.price.toFixed(2)}</span>
        <span class="mini-label ${getValueClass(stock.return)}">${stock.return}</span>
      </div>

      <div class="card-actions">
        <button onclick="showDetail(${realIndex})">View Details</button>
        <button class="heart-btn ${stock.favorite ? "active" : ""}" onclick="toggleFavorite(${realIndex})">♥</button>
      </div>
    `;

    list.appendChild(card);
  });
}

function toggleFavorite(index) {
  stocks[index].favorite = !stocks[index].favorite;
  renderStocks();
}

function showDetail(index) {
  const stock = stocks[index];

  document.getElementById("detailName").textContent = stock.name;
  document.getElementById("detailTicker").textContent = stock.ticker;

  document.getElementById("quickAlertTicker").textContent = stock.ticker;
  document.getElementById("quickAlertPrice").value = "";
  document.getElementById("quickAlertError").textContent = "";
  document.getElementById("quickAlertSuccess").textContent = "";
  currentDetailIndex = index;
  
  document.getElementById("currentPrice").textContent = `$${stock.price.toFixed(2)}`;
  document.getElementById("investedPrice").textContent = `$${stock.invest.toFixed(2)}`;
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

renderStocks();
function validateTickerInput(value) {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return { valid: false, msg: "Ticker is required." };
  if (!/^[A-Z]{1,5}$/.test(trimmed)) return { valid: false, msg: "Enter 1-5 letters (e.g. AAPL)." };
  return { valid: true, value: trimmed };
}

function validatePriceInput(value) {
  const num = parseFloat(value);
  if (value === "" || isNaN(num)) return { valid: false, msg: "Enter a valid price." };
  if (num <= 0) return { valid: false, msg: "Price must be greater than $0." };
  return { valid: true, value: num };
}

function addAlert(ticker, price, condition, notify) {
  activeAlerts.push({ ticker, price, condition, notify, id: Date.now() });
  renderAlerts();
}

function renderAlerts() {
  const banner = document.getElementById("alertsBanner");
  const alertsList = document.getElementById("alertsList");
  if (activeAlerts.length === 0) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "block";
  alertsList.innerHTML = "";
  activeAlerts.forEach((alert) => {
    const tag = document.createElement("div");
    tag.className = "alert-tag";
    tag.innerHTML = `
      <span class="alert-ticker">${alert.ticker}</span>
      <span class="alert-condition">${alert.condition === "above" ? "↑" : "↓"} $${alert.price.toFixed(2)}</span>
      <span class="alert-notify">${alert.notify}</span>
      <button class="remove-alert-btn" data-id="${alert.id}" type="button">✕</button>
    `;
    alertsList.appendChild(tag);
  });
  alertsList.querySelectorAll(".remove-alert-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      activeAlerts = activeAlerts.filter((a) => a.id !== id);
      renderAlerts();
    };
  });
}

document.getElementById("clearAlerts").onclick = () => {
  activeAlerts = [];
  renderAlerts();
};

document.getElementById("submitAlert").onclick = () => {
  const tickerError = document.getElementById("tickerError");
  const priceError = document.getElementById("priceError");
  const formSuccess = document.getElementById("formSuccess");
  tickerError.textContent = "";
  priceError.textContent = "";
  formSuccess.textContent = "";
  const tickerResult = validateTickerInput(document.getElementById("alertTicker").value);
  const priceResult = validatePriceInput(document.getElementById("alertPrice").value);
  let valid = true;
  if (!tickerResult.valid) { tickerError.textContent = tickerResult.msg; valid = false; }
  if (!priceResult.valid) { priceError.textContent = priceResult.msg; valid = false; }
  if (!valid) return;
  const condition = document.getElementById("alertCondition").value;
  const notify = document.getElementById("alertNotify").value;
  addAlert(tickerResult.value, priceResult.value, condition, notify);
  document.getElementById("alertTicker").value = "";
  document.getElementById("alertPrice").value = "";
  formSuccess.textContent = `✓ Alert set: ${tickerResult.value} ${condition} $${priceResult.value.toFixed(2)} via ${notify}`;
  setTimeout(() => { formSuccess.textContent = ""; }, 3500);
};

document.getElementById("alertTicker").addEventListener("input", function () {
  const result = validateTickerInput(this.value);
  document.getElementById("tickerError").textContent = result.valid || !this.value.trim() ? "" : result.msg;
});

document.getElementById("quickAlertBtn").onclick = () => {
  const quickError = document.getElementById("quickAlertError");
  const quickSuccess = document.getElementById("quickAlertSuccess");
  quickError.textContent = "";
  quickSuccess.textContent = "";
  const priceResult = validatePriceInput(document.getElementById("quickAlertPrice").value);
  if (!priceResult.valid) { quickError.textContent = priceResult.msg; return; }
  const stock = stocks[currentDetailIndex];
  const condition = document.getElementById("quickAlertCondition").value;
  addAlert(stock.ticker, priceResult.value, condition, "email");
  document.getElementById("quickAlertPrice").value = "";
  quickSuccess.textContent = `✓ Alert set for ${stock.ticker} ${condition} $${priceResult.value.toFixed(2)}`;
  setTimeout(() => { quickSuccess.textContent = ""; }, 3500);
};

favoritesLink.onclick = (e) => {
  e.preventDefault();

  detail.classList.remove("active");
  listView.style.display = "block";

  showingFavorites = true;
  currentSector = "All";
  searchTerm = "";
  searchInput.value = "";

  pageTitle.textContent = "Favorite Stocks";
  backToAllBtn.style.display = "block";

  renderStocks();
};

backToAllBtn.onclick = () => {
  showingFavorites = false;
  currentSector = "All";
  searchTerm = "";
  searchInput.value = "";

  pageTitle.textContent = "My Stock Site";
  backToAllBtn.style.display = "none";

  detail.classList.remove("active");
  listView.style.display = "block";

  renderStocks();
};

const sectorLinks = document.querySelectorAll(".sectorLink");

sectorLinks.forEach((link) => {
  link.onclick = (e) => {
    e.preventDefault();

    detail.classList.remove("active");
    listView.style.display = "block";

    showingFavorites = false;
    currentSector = link.dataset.sector;
    searchTerm = "";
    searchInput.value = "";

    pageTitle.textContent = currentSector + " Stocks";
    backToAllBtn.style.display = "block";

    renderStocks();
  };
});

searchBtn.onclick = () => {
  detail.classList.remove("active");
  listView.style.display = "block";

  showingFavorites = false;
  currentSector = "All";
  searchTerm = searchInput.value.trim().toLowerCase();

  pageTitle.textContent = searchTerm === "" ? "My Stock Site" : `Search Results: ${searchInput.value}`;
  backToAllBtn.style.display = searchTerm === "" ? "none" : "block";

  renderStocks();
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