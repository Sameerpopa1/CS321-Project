import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const STOCKS_COLLECTION = "stocks";

export async function getAllStocks() {
  const snapshot = await getDocs(collection(db, STOCKS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getStockById(stockId) {
  const ref = doc(db, STOCKS_COLLECTION, stockId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getStocksBySector(sector) {
  if (!sector || sector === "All") return getAllStocks();
  const q = query(
    collection(db, STOCKS_COLLECTION),
    where("sector", "==", sector.trim())
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

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

export function sortStocksAlphabetically(stocks) {
  return [...stocks].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}
