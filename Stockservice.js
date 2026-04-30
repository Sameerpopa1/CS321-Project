// stockService.js - business logic for stocks.
// Application layer. Combines stock metadata from Firestore with live prices from API.
// Database calls go through StockRepository. API calls go through StockApiClient.

import { stockRepository } from "./StockRepository.js";
import { stockApiClient } from "./StockApiClient.js";


// Read Operation

export async function getAllStocks() {
  const stocks = await stockRepository.findAll();
  return await Promise.all(stocks.map(s => enrichWithQuote(s)));
}

export async function getStockById(stockId) {
  const stock = await stockRepository.findById(stockId);
  if (!stock) return null;
  return await enrichWithQuote(stock);
}

export async function getStocksBySector(sector) {
  if (!sector || sector === "All") return getAllStocks();
  const stocks = await stockRepository.findBySector(sector);
  return await Promise.all(stocks.map(s => enrichWithQuote(s)));
}

// Search

export async function searchStocks(term) {
  if (!term || term.trim() === "") return getAllStocks();
  const normalized = term.trim().toLowerCase();
  const all = await getAllStocks();
  return all.filter((stock) =>
    stock.name?.toLowerCase().includes(normalized) ||
    stock.ticker?.toLowerCase() === normalized ||
    stock.sector?.toLowerCase().includes(normalized)
  );
}

// Sorting

export function sortStocksAlphabetically(stocks) {
  return [...stocks].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}


// Combines stored metadata (name, sector) with a live price from the API.
// Returns null for price fields if the API call fails - the rest of the app
// can still display the stock with "N/A" for the price.
async function enrichWithQuote(stock) {
  try {
    const quote = await stockApiClient.getQuote(stock.ticker);
    return {
      ...stock,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
    };
  } catch (err) {
    console.error(`Failed to fetch quote for ${stock.ticker}:`, err.message);
    return {
      ...stock,
      price: null,
      change: null,
      changePercent: "N/A",
    };
  }
}
