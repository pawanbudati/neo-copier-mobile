import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccountSummary, AppSettings, TradeOrder, WatchlistItem, Position, SystemLog } from "../types";

export const STORAGE_KEYS = {
  SERVER_URL: "@neo_copier_server_url",
  SETTINGS: "@neo_copier_settings",
  WATCHLIST: "@neo_copier_watchlist",
};

export const DEFAULT_SERVER_URL = "http://10.0.2.2:8080";

let currentServerUrl = DEFAULT_SERVER_URL;

export async function initServerUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
    if (saved && saved.trim()) {
      currentServerUrl = saved.trim().replace(/\/+$/, "");
    }
  } catch (e) {
    console.warn("Failed to load server URL from storage", e);
  }
  return currentServerUrl;
}

export function getServerUrl(): string {
  return currentServerUrl;
}

export async function setServerUrl(url: string): Promise<void> {
  const cleanUrl = url.trim().replace(/\/+$/, "");
  currentServerUrl = cleanUrl;
  await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, cleanUrl);
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${currentServerUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export const ApiService = {
  // Accounts
  async getAccounts(): Promise<AccountSummary[]> {
    return request<AccountSummary[]>("/api/accounts");
  },

  async addAccount(accountData: any): Promise<AccountSummary> {
    return request<AccountSummary>("/api/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    });
  },

  async updateAccount(id: string, accountData: any): Promise<AccountSummary> {
    return request<AccountSummary>(`/api/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(accountData),
    });
  },

  async deleteAccount(id: string): Promise<void> {
    return request<void>(`/api/accounts/${id}`, {
      method: "DELETE",
    });
  },

  async loginAccount(id: string): Promise<any> {
    return request<any>(`/api/accounts/${id}/login`, {
      method: "POST",
    });
  },

  // Upstox
  async getUpstoxStatus(): Promise<{ hasToken: boolean; authUrl?: string }> {
    return request<{ hasToken: boolean; authUrl?: string }>("/api/upstox/status");
  },

  async addUpstoxAccount(accountData: any): Promise<any> {
    return request<any>("/api/upstox/account", {
      method: "POST",
      body: JSON.stringify(accountData),
    });
  },

  async submitUpstoxAuthCode(code: string): Promise<any> {
    return request<any>("/api/upstox/token", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  // Orders
  async getOrders(): Promise<TradeOrder[]> {
    return request<TradeOrder[]>("/api/orders");
  },

  async placeOrder(orderData: any): Promise<any> {
    return request<any>("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  async cancelOrder(orderId: string): Promise<any> {
    return request<any>(`/api/orders/${orderId}/cancel`, {
      method: "POST",
    });
  },

  // Positions
  async getPositions(): Promise<Position[]> {
    return request<Position[]>("/api/positions");
  },

  async squareOffPosition(symbol: string): Promise<any> {
    return request<any>(`/api/positions/square-off/${encodeURIComponent(symbol)}`, {
      method: "POST",
    });
  },

  async squareOffAllPositions(): Promise<any> {
    return request<any>("/api/positions/square-off-all", {
      method: "POST",
    });
  },

  // Scrips & Search
  async searchScrips(query: string): Promise<any[]> {
    return request<any[]>(`/api/scrips/search?q=${encodeURIComponent(query)}`);
  },

  async getScripCategories(): Promise<any[]> {
    return request<any[]>("/api/scrips/categories");
  },

  // Watchlist
  async getWatchlist(): Promise<WatchlistItem[]> {
    return request<WatchlistItem[]>("/api/watchlist");
  },

  async addToWatchlist(item: any): Promise<WatchlistItem> {
    return request<WatchlistItem>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  async removeFromWatchlist(scriptToken: string): Promise<void> {
    return request<void>(`/api/watchlist/${encodeURIComponent(scriptToken)}`, {
      method: "DELETE",
    });
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    return request<AppSettings>("/api/settings");
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return request<AppSettings>("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },

  // System & Logs
  async getSystemStatus(): Promise<any> {
    return request<any>("/api/system/status");
  },

  async getLogs(): Promise<SystemLog[]> {
    return request<SystemLog[]>("/api/logs");
  },

  // Chart OHLC Data
  async getCandles(symbol: string, interval: string = "1m"): Promise<any[]> {
    return request<any[]>(`/api/upstox/candles?symbol=${encodeURIComponent(symbol)}&interval=${interval}`);
  },
};
