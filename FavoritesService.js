// favoritesService.js - business logic for favorite stocks.
// Application layer. Database calls go through FavoritesRepository.

import { favoritesRepository } from "../db/FavoritesRepository.js";

export async function getFavorites(userId) {
  if (!userId) throw new Error("userId is required.");
  return await favoritesRepository.findAll(userId);
}


export async function isFavorited(userId, stockId) {
  if (!userId || !stockId) return false;
  return await favoritesRepository.exists(userId, stockId);
}

export async function addFavorite(userId, stockId, ticker) {
  if (!userId) throw new Error("userId is required.");
  if (!stockId) throw new Error("stockId is required.");
  await favoritesRepository.save(userId, stockId, ticker);
}

export async function removeFavorite(userId, stockId) {
  if (!userId) throw new Error("userId is required.");
  if (!stockId) throw new Error("stockId is required.");
  await favoritesRepository.delete(userId, stockId);
}

// Business logic: toggle decides whether to add or remove based on current state.
// That decision belongs in the service, not the repository.
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
