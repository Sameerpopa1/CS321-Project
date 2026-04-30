import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const USERS_COLLECTION = "users";
const ALERTS_SUBCOLLECTION = "alerts";

export function validateTicker(value) {
  const trimmed = (value ?? "").trim().toUpperCase();
  if (!trimmed) return { valid: false, msg: "Ticker is required." };
  if (!/^[A-Z]{1,5}$/.test(trimmed)) return { valid: false, msg: "Enter 1-5 letters only (e.g. AAPL)." };
  return { valid: true, value: trimmed };
}

export function validatePrice(value) {
  const num = parseFloat(value);
  if (value === "" || value === null || value === undefined || isNaN(num))
    return { valid: false, msg: "Enter a valid price." };
  if (num <= 0) return { valid: false, msg: "Price must be greater than $0." };
  return { valid: true, value: num };
}

export function validateCondition(condition) {
  if (condition !== "above" && condition !== "below")
    return { valid: false, msg: "Condition must be 'above' or 'below'." };
  return { valid: true };
}

export function validateAlertForm(fields) {
  const errors = {};
  const tickerResult = validateTicker(fields.ticker);
  const priceResult = validatePrice(fields.price);
  const conditionResult = validateCondition(fields.condition);
  if (!tickerResult.valid) errors.ticker = tickerResult.msg;
  if (!priceResult.valid) errors.price = priceResult.msg;
  if (!conditionResult.valid) errors.condition = conditionResult.msg;
  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors: {},
    parsed: {
      ticker: tickerResult.value,
      price: priceResult.value,
      condition: fields.condition,
    },
  };
}

export async function addAlert(userId, alertData) {
  if (!userId) throw new Error("userId is required.");
  const { errors, parsed } = validateAlertForm(alertData);
  if (Object.keys(errors).length > 0)
    throw new Error("Invalid alert data: " + JSON.stringify(errors));
  const ref = collection(db, USERS_COLLECTION, userId, ALERTS_SUBCOLLECTION);
  const docRef = await addDoc(ref, {
    ticker: parsed.ticker,
    price: parsed.price,
    condition: parsed.condition,
    notify: alertData.notify ?? "email",
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getAlerts(userId) {
  if (!userId) throw new Error("userId is required.");
  const ref = collection(db, USERS_COLLECTION, userId, ALERTS_SUBCOLLECTION);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function removeAlert(userId, alertId) {
  if (!userId) throw new Error("userId is required.");
  if (!alertId) throw new Error("alertId is required.");
  await deleteDoc(doc(db, USERS_COLLECTION, userId, ALERTS_SUBCOLLECTION, alertId));
}

export async function clearAllAlerts(userId) {
  if (!userId) throw new Error("userId is required.");
  const alerts = await getAlerts(userId);
  await Promise.all(alerts.map((a) => removeAlert(userId, a.id)));
}
