// FavoritesRepository - handles Firestore CRUD for per-user favorites.
// Single responsibility: persist and retrieve user favorites.
// Stored as a subcollection: users/{userId}/favorites


import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const USERS = "users";
const FAVORITES = "favorites";

export class FavoritesRepository {

  async findAll(userId) {
    const ref = collection(db, USERS, userId, FAVORITES);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(d => d.id);
  }

  async exists(userId, stockId) {
    const ref = doc(db, USERS, userId, FAVORITES, stockId);
    const snapshot = await getDoc(ref);
    return snapshot.exists();
  }

  async save(userId, stockId, ticker) {
    const ref = doc(db, USERS, userId, FAVORITES, stockId);
    await setDoc(ref, {
      ticker: ticker ?? "",
      addedAt: new Date().toISOString(),
    });
  }

  async delete(userId, stockId) {
    await deleteDoc(doc(db, USERS, userId, FAVORITES, stockId));
  }
}

export const favoritesRepository = new FavoritesRepository();
