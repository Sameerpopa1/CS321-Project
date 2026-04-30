// AlertRepository - handles Firestore CRUD for per-user alerts.
// Single responsibility: persist and retrieve user alerts.
// Stored as a subcollection: users/{userId}/alerts

import { db } from "./firebase-config.js";
import {
  collection, doc, addDoc, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const USERS = "users";
const ALERTS = "alerts";

export class AlertRepository {

  async save(userId, alert) {
    const ref = collection(db, USERS, userId, ALERTS);
    const docRef = await addDoc(ref, {
      ticker: alert.ticker,
      price: alert.price,
      condition: alert.condition,
      notify: alert.notify ?? "email",
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...alert };
  }

  async findAll(userId) {
    const ref = collection(db, USERS, userId, ALERTS);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async delete(userId, alertId) {
    await deleteDoc(doc(db, USERS, userId, ALERTS, alertId));
  }

  async deleteAll(userId) {
    const ref = collection(db, USERS, userId, ALERTS);
    const snapshot = await getDocs(ref);
    const deletions = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletions);
  }
}

export const alertRepository = new AlertRepository();
