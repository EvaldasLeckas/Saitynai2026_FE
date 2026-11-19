// src/Utils/Api.js
export const API_URL = "http://localhost:5083";
const TOKEN_KEY = "token";

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearAccessToken = () => localStorage.removeItem(TOKEN_KEY);

let refreshPromise = null; // one refresh at a time (your backend rotates the cookie)

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/api/accessToken`, {
    method: "POST",
    credentials: "include", // sends the RefreshToken cookie
  });
  if (!res.ok) throw new Error("Refresh failed");
  const { accessToken } = await res.json();
  setAccessToken(accessToken);
  return accessToken;
}

function getFreshToken() {
  refreshPromise ??= refreshAccessToken().finally(() => (refreshPromise = null));
  return refreshPromise;
}

function forceLogout() {
  clearAccessToken();
  window.location.href = "/login";
}

export function refreshSession() {
  return getFreshToken();
}
export async function logout() {
  try {
    await fetch(`${API_URL}/api/logout`, { method: "POST", credentials: "include" });
  } finally {
    clearAccessToken();
  }
}
export function getTokenPayload() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}
function getRoles(payload) {
  const raw =
    payload?.role ??
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    [];
  return Array.isArray(raw) ? raw : [raw];
}

export const isAdmin = () => getRoles(getTokenPayload()).includes("Admin");
export const ownsLobby = () => getRoles(getTokenPayload()).includes("LobbyOwner");

export async function apiFetch(url, options = {}) {
  const send = (token) =>
    fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });

  let token = getAccessToken();
  try {
    if (!token) token = await getFreshToken();
  } catch {
    forceLogout();
    throw new Error("Session expired");
  }

  let response = await send(token); // network errors propagate normally

  if (response.status === 401) {
    try {
      response = await send(await getFreshToken()); // retry once
    } catch {
      forceLogout();
      throw new Error("Session expired");
    }
  }
  return response;
}