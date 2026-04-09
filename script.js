const stocks = [
  { name: "A", ticker: "AAA", price: 100.25, invest: 800, shares: 5, return: "+10.4%", change: "+1.3%", sector: "Technology", note: "Sample stock A." },
  { name: "B", ticker: "BBB", price: 214.8, invest: 1500, shares: 6, return: "-3.2%", change: "-0.8%", sector: "Energy", note: "Sample stock B." },
  { name: "C", ticker: "CCC", price: 58.4, invest: 300, shares: 4, return: "+5.1%", change: "+0.6%", sector: "Healthcare", note: "Sample stock C." }
];
let activeAlerts = [];
let currentDetailIndex = null;

const list = document.getElementById("stockList");
const detail = document.getElementById("detailView");
const listView = document.getElementById("listView");

function getValueClass(value) {
  return value.startsWith("-") ? "negative" : "positive";
}

function renderStocks() {
  list.innerHTML = "";

  stocks.forEach((stock, index) => {
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

      <button onclick="showDetail(${index})">View Details</button>
    `;

    list.appendChild(card);
  });
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
