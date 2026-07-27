import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AccountSummary,
  AppSettings,
  TradeOrder,
  WatchlistItem,
  Position,
  QuoteData,
  SystemLog,
  OcoRule,
  AccountMargin,
  SystemPower,
} from "../types";

export const STORAGE_KEYS = {
  SERVER_URL: "@neo_copier_server_url",
  SETTINGS: "@neo_copier_settings",
  WATCHLIST: "@neo_copier_watchlist",
};

export const DEFAULT_SERVER_URL = "https://neo-copier.duckdns.org";

let currentServerUrl = DEFAULT_SERVER_URL;

export async function initServerUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
    if (saved && saved.trim()) {
      currentServerUrl = saved.trim().replace(/\/+$/, "");
    } else {
      currentServerUrl = DEFAULT_SERVER_URL;
      await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, DEFAULT_SERVER_URL);
    }
  } catch (e) {
    console.warn("Failed to load server URL from storage", e);
    currentServerUrl = DEFAULT_SERVER_URL;
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

async function request<T>(endpoint: string, options?: RequestInit, timeoutMs = 15000): Promise<T> {
  const url = `${currentServerUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
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
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Backend may be slow or unreachable.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const ApiService = {
  // ─── Accounts ──────────────────────────────────────────────────────────────
  async getAccounts(): Promise<AccountSummary[]> {
    return request<AccountSummary[]>("/api/accounts");
  },

  async addAccount(accountData: any): Promise<any> {
    return request<any>("/api/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    });
  },

  async updateAccount(id: string, accountData: any): Promise<any> {
    return request<any>("/api/accounts", {
      method: "POST",
      body: JSON.stringify({ ...accountData, id }),
    });
  },

  async deleteAccount(id: string): Promise<void> {
    return request<void>(`/api/accounts/${id}`, {
      method: "DELETE",
    });
  },

  async loginAccount(id: string, manualOtp?: string): Promise<any> {
    return request<any>(`/api/accounts/${id}/login`, {
      method: "POST",
      body: manualOtp ? JSON.stringify({ manualOtp }) : undefined,
    });
  },

  async loginAllAccounts(): Promise<any> {
    return request<any>("/api/accounts/refresh-all", {
      method: "POST",
    });
  },

  async getTotpPreview(id: string): Promise<{ code?: string; error?: string }> {
    return request<{ code?: string; error?: string }>(`/api/accounts/${id}/totp-preview`);
  },

  async getMargins(): Promise<AccountMargin[]> {
    return request<AccountMargin[]>("/api/accounts/margins");
  },

  async getFeedCredentials(): Promise<{ accessToken: string; sid: string; serverId?: string; dataCenter?: string }> {
    return request<any>("/api/accounts/feed-credentials");
  },

  // ─── Upstox ────────────────────────────────────────────────────────────────
  async getUpstoxStatus(): Promise<{ hasToken: boolean; authUrl?: string }> {
    return request<{ hasToken: boolean; authUrl?: string }>("/api/upstox/status");
  },

  async getUpstoxConfig(): Promise<any> {
    return request<any>("/api/upstox/config");
  },

  async addUpstoxAccount(accountData: any): Promise<any> {
    return request<any>("/api/upstox/config", {
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

  // ─── Orders ────────────────────────────────────────────────────────────────
  async getOrders(): Promise<TradeOrder[]> {
    return request<TradeOrder[]>("/api/orders");
  },

  async placeOrder(orderData: any): Promise<any> {
    return request<any>("/api/orders/replicate", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  async syncOrdersStatus(): Promise<any> {
    return request<any>("/api/orders/sync-status", {
      method: "POST",
    });
  },

  async cancelOrder(orderId: string): Promise<any> {
    return request<any>(`/api/orders/${orderId}/cancel`, {
      method: "POST",
    });
  },

  async modifyOrder(orderId: string, orderData: any): Promise<any> {
    return request<any>(`/api/orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    });
  },

  async deleteOrder(orderId: string): Promise<any> {
    return request<any>(`/api/orders/${orderId}`, {
      method: "DELETE",
    });
  },

  async clearOrders(): Promise<any> {
    return request<any>("/api/orders", {
      method: "DELETE",
    });
  },

  async calculateMarginRequired(payload: any): Promise<any> {
    return request<any>("/api/orders/margin-required", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── Positions & OCO Rules ──────────────────────────────────────────────────
  async getPositions(): Promise<Position[]> {
    const data = await request<any>("/api/accounts/positions");
    if (!Array.isArray(data)) return [];
    const allPositions: Position[] = [];
    for (const item of data) {
      if (item && Array.isArray(item.positions)) {
        allPositions.push(...item.positions);
      } else if (item && (item.symbol || item.tradingSymbol || item.netQty !== undefined)) {
        allPositions.push(item);
      }
    }
    return allPositions;
  },

  async squareOffPosition(symbol: string, accountId?: string, quantity?: number): Promise<any> {
    return request<any>("/api/positions/exit", {
      method: "POST",
      body: JSON.stringify({ symbol, accountId, quantity }),
    });
  },

  async squareOffAllPositions(): Promise<any> {
    return request<any>("/api/positions/exit-all", {
      method: "POST",
    });
  },

  async createOcoRule(payload: { symbol: string; targetPrice: number; stopLossPrice: number; productType?: string }): Promise<any> {
    return request<any>("/api/positions/oco", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getActiveOcoRules(): Promise<OcoRule[]> {
    return request<OcoRule[]>("/api/positions/oco/active");
  },

  async deleteOcoRule(ocoId: string): Promise<any> {
    return request<any>(`/api/positions/oco/${ocoId}`, {
      method: "DELETE",
    });
  },

  async searchScrips(query: string): Promise<any[]> {
    const data = await request<any>(`/api/search?q=${encodeURIComponent(query)}`);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  },

  async getScripStatus(): Promise<any> {
    return request<any>("/api/scrips/status");
  },

  async getDailySyncStatus(): Promise<any> {
    return request<any>("/api/scrips/daily-sync-status");
  },

  async loadDailyOptions(): Promise<any> {
    return request<any>("/api/scrips/load-daily-options", {
      method: "POST",
    });
  },

  async loadScripCategory(category: string): Promise<any> {
    return request<any>("/api/scrips/load", {
      method: "POST",
      body: JSON.stringify({ category }),
    });
  },

  async clearScrips(): Promise<any> {
    return request<any>("/api/scrips/clear", {
      method: "POST",
    });
  },

  async getCacheStatus(): Promise<any> {
    return request<any>("/api/scrips/cache/status");
  },

  async populateCache(): Promise<any> {
    return request<any>("/api/scrips/cache", {
      method: "POST",
    });
  },

  // ─── Watchlist ─────────────────────────────────────────────────────────────
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

  // ─── Settings & Power Control ─────────────────────────────────────────────
  async getSettings(): Promise<AppSettings> {
    return request<AppSettings>("/api/settings");
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return request<AppSettings>("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },

  async getSystemPower(): Promise<SystemPower> {
    return request<SystemPower>("/api/system/power");
  },

  async setSystemPower(active: boolean): Promise<SystemPower> {
    return request<SystemPower>("/api/system/power", {
      method: "POST",
      body: JSON.stringify({ active }),
    });
  },

  // ─── System & Logs ────────────────────────────────────────────────────────
  async getSystemStatus(): Promise<any> {
    try {
      return await request<any>("/api/system/status");
    } catch (e) {
      return await request<any>("/");
    }
  },

  async getLogs(): Promise<SystemLog[]> {
    return request<SystemLog[]>("/api/logs?lines=500");
  },

  async clearLogs(): Promise<any> {
    return request<any>("/api/logs/clear", {
      method: "POST",
    });
  },

  // ─── Chart OHLC Candle History ──────────────────────────────────────────────
  async getCandles(
    token?: string,
    symbol?: string,
    exchange?: string,
    segment?: string,
    timeframe: string = "1m"
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (token) params.append("token", token);
    if (symbol) params.append("symbol", symbol);
    if (exchange) params.append("exchange", exchange);
    if (segment) params.append("segment", segment);
    params.append("timeframe", timeframe);
    return request<any[]>(`/api/scrips/history?${params.toString()}`);
  },
};
