// StockRepository - handles Firestore CRUD for the "stocks" collection.
// Single responsibility: persist and retrieve stock metadata.
import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, getDoc, setDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const COLLECTION = "stocks";

export class StockRepository {

  async findAll() {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async findById(stockId) {
    const snapshot = await getDoc(doc(db, COLLECTION, stockId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  }

  async findBySector(sector) {
    const q = query(
      collection(db, COLLECTION),
      where("sector", "==", sector.trim())
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async save(stock) {
    await setDoc(doc(db, COLLECTION, stock.ticker), {
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      note: stock.note || "",
    });
    return stock;
  }
}

export const stockRepository = new StockRepository();
