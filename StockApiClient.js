// StockApiClient - wraps the Alpha Vantage API.
// Single responsibility: fetch live stock data from an external API.
// Includes a 60-second in-memory cache to conserve daily API calls.

const API_KEY = "Z4V9DGUEUAQXQ2OT"; 
const BASE_URL = "https://www.alphavantage.co/query";
const CACHE_TTL_MS = 60 * 1000;


export class StockApiClient {
  constructor() {
    this.quoteCache = new Map();
  }

  // Fetch a live price quote. Cached for 60 seconds.
  async getQuote(ticker) {
    const cached = this.quoteCache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note || data.Information) {
      throw new Error("API rate limit reached. Wait a minute and try again.");
    }

    const quote = data["Global Quote"];
    if (!quote || !quote["05. price"]) {
      throw new Error(`No quote data found for ticker: ${ticker}`);
    }

    const result = {
      ticker: quote["01. symbol"],
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
      changePercent: quote["10. change percent"],
    };

    this.quoteCache.set(ticker, { data: result, timestamp: Date.now() });
    return result;
  }

  // Fetch company info (name, sector, description). Heavier call - only
  // use when first adding a stock to the database.
  async getOverview(ticker) {
    const url = `${BASE_URL}?function=OVERVIEW&symbol=${ticker}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note || data.Information) {
      throw new Error("API rate limit reached. Wait a minute and try again.");
    }
    if (!data.Symbol) {
      throw new Error(`No company info found for: ${ticker}`);
    }

    return {
      ticker: data.Symbol,
      name: data.Name,
      sector: data.Sector,
      description: data.Description,
    };
  }
}

// Single shared instance
export const stockApiClient = new StockApiClient();
