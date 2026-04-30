import { db } from "../firebase.js";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
 
const USERS_COLLECTION = "users";
const FAVORITES_SUBCOLLECTION = "favorites";
 
function getFavoriteRef(userId, stockId) {
  return doc(db, USERS_COLLECTION, userId, FAVORITES_SUBCOLLECTION, stockId);
}
 
export async function getFavorites(userId) {
  if (!userId) throw new Error("userId is required.");
  const ref = collection(db, USERS_COLLECTION, userId, FAVORITES_SUBCOLLECTION);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((d) => d.id);
}
 
export async function isFavorited(userId, stockId) {
  if (!userId || !stockId) return false;
  const snapshot = await getDoc(getFavoriteRef(userId, stockId));
  return snapshot.exists();
}
 
export async function addFavorite(userId, stockId, ticker) {
  if (!userId) throw new Error("userId is required.");
  if (!stockId) throw new Error("stockId is required.");
  await setDoc(getFavoriteRef(userId, stockId), {
    ticker: ticker ?? "",
    addedAt: new Date().toISOString(),
  });
}
 
export async function removeFavorite(userId, stockId) {
  if (!userId) throw new Error("userId is required.");
  if (!stockId) throw new Error("stockId is required.");
  await deleteDoc(getFavoriteRef(userId, stockId));
}
 
export async function toggleFavorite(userId, stockId, ticker) {
  const already = await isFavorited(userId, stockId);
  if (already) {
    await removeFavorite(userId, stockId);
    return false;
  } else {
    await addFavorite(userId, stockId, ticker);
    return true;
  }
}
