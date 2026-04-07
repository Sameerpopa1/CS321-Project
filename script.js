const stocks = [
  { name: "A", ticker: "AAA", price: 100.25, invest: 800, shares: 5, return: "+10.4%", change: "+1.3%", sector: "Technology", note: "Sample stock A." },
  { name: "B", ticker: "BBB", price: 214.8, invest: 1500, shares: 6, return: "-3.2%", change: "-0.8%", sector: "Energy", note: "Sample stock B." },
  { name: "C", ticker: "CCC", price: 58.4, invest: 300, shares: 4, return: "+5.1%", change: "+0.6%", sector: "Healthcare", note: "Sample stock C." }
];

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