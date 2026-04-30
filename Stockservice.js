// stockService.js - business logic for stocks.
// Application layer. Combines stock metadata from Firestore with live prices from API.
// Database calls go through StockRepository. API calls go through StockApiClient.

import { stockRepository } from "./StockRepository.js";
import { stockApiClient } from "./StockApiClient.js";

// Read operations

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

// ADD STOCK TO WATCHLIST
// Fetches company info from Alpha Vantage, then saves to Firestore.
// If the ticker is already in the watchlist, returns the existing one.

export async function addToWatchlist(ticker) {
  const upper = (ticker || "").trim().toUpperCase();

  // Validate the ticker format
  if (!/^[A-Z]{1,5}$/.test(upper)) {
    throw new Error("Invalid ticker. Use 1-5 letters (e.g. AAPL).");
  }

  // Check if it already exists in our watchlist
  const existing = await stockRepository.findById(upper);
  if (existing) {
    return await enrichWithQuote(existing);
  }

  // Fetch company info from Alpha Vantage
  const overview = await stockApiClient.getOverview(upper);

  // Save to Firestore
  await stockRepository.save({
    ticker: upper,
    name: overview.name,
    sector: overview.sector,
    note: "",
  });

  // Return the new stock with its live price already attached
  return await enrichWithQuote({
    ticker: upper,
    name: overview.name,
    sector: overview.sector,
    note: "",
  });
}

// REMOVE STOCK FROM WATCHLIST
export async function removeFromWatchlist(stockId) {
  if (!stockId) throw new Error("stockId is required.");
  await stockRepository.delete(stockId);
}

// SEARCH (filtering happens in business logic, not the repository)
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
