// alertService.js - business logic for price alerts.
// Application layer. Validation rules live here. Database calls go through AlertRepository.

import { alertRepository } from "./AlertRepository.js";



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

  const saved = await alertRepository.save(userId, {
    ticker: parsed.ticker,
    price: parsed.price,
    condition: parsed.condition,
    notify: alertData.notify ?? "email",
  });
  return saved.id;
}

export async function getAlerts(userId) {
  if (!userId) throw new Error("userId is required.");
  return await alertRepository.findAll(userId);
}

export async function removeAlert(userId, alertId) {
  if (!userId) throw new Error("userId is required.");
  if (!alertId) throw new Error("alertId is required.");
  await alertRepository.delete(userId, alertId);
}

export async function clearAllAlerts(userId) {
  if (!userId) throw new Error("userId is required.");
  await alertRepository.deleteAll(userId);
}
