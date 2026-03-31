// Simple stock data
const stocks = [
  { name: "A", ticker: "AAA", price: 100, invest: 800, shares: 5, return: "+10%" },
  { name: "B", ticker: "BBB", price: 200, invest: 1500, shares: 6, return: "-3%" },
  { name: "C", ticker: "CCC", price: 50, invest: 300, shares: 4, return: "+5%" }
];

const list = document.getElementById("stockList");
const detail = document.getElementById("detailView");
const listView = document.getElementById("listView");

// Render list
stocks.forEach((s, i) => {
  const div = document.createElement("div");
  div.className = "stock-card";
  div.innerHTML = `
    <h3>${s.name}</h3>
    <p>${s.ticker}</p>
    <button onclick="show(${i})">View</button>
  `;
  list.appendChild(div);
});

// Show detail
function show(i) {
  const s = stocks[i];

  document.getElementById("currentPrice").textContent = "$" + s.price;
  document.getElementById("investedPrice").textContent = "$" + s.invest;
  document.getElementById("detailName").textContent = s.name;
  document.getElementById("detailTicker").textContent = s.ticker;
  document.getElementById("detailShares").textContent = s.shares;
  document.getElementById("detailReturn").textContent = s.return;

  listView.style.display = "none";
  detail.classList.add("active");
}

// Back button
document.getElementById("backBtn").onclick = () => {
  detail.classList.remove("active");
  listView.style.display = "block";
};

// Mode switch
const screen = document.getElementById("screen");

document.getElementById("desktopMode").onclick = () => {
  screen.classList.remove("mobile");
};

document.getElementById("mobileMode").onclick = () => {
  screen.classList.add("mobile");
};