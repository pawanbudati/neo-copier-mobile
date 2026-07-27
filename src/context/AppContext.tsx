import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AccountSummary,
  AppSettings,
  TradeOrder,
  WatchlistItem,
  Position,
  QuoteData,
  SystemLog,
} from "../types";
import { ApiService, initServerUrl, getServerUrl, setServerUrl as saveServerUrl } from "../services/api";
import { kotakFeed } from "../services/kotakWebSocket";

interface AppContextType {
  serverUrl: string;
  updateServerUrl: (url: string) => Promise<void>;
  isConnected: boolean;
  isConnecting: boolean;

  accounts: AccountSummary[];
  refreshAccounts: () => Promise<void>;

  orders: TradeOrder[];
  refreshOrders: () => Promise<void>;

  positions: Position[];
  refreshPositions: () => Promise<void>;

  watchlist: WatchlistItem[];
  refreshWatchlist: () => Promise<void>;
  addToWatchlist: (item: any) => Promise<void>;
  removeFromWatchlist: (scriptToken: string) => Promise<void>;

  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  quotes: Record<string, QuoteData>;
  logs: SystemLog[];
  refreshLogs: () => Promise<void>;

  totalPnl: number;
  upstoxConnected: boolean;
  upstoxAuthUrl: string;
  refreshUpstoxStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrlState] = useState<string>(getServerUrl());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    autoReplicate: true,
    autoRenewSessions: true,
  });

  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [upstoxConnected, setUpstoxConnected] = useState<boolean>(false);
  const [upstoxAuthUrl, setUpstoxAuthUrl] = useState<string>("");

  // Total MTM P&L calculated from positions
  const totalPnl = positions.reduce((acc, pos) => {
    if (!pos) return acc;
    const liveLtp = Number(quotes[pos.symbol]?.ltp || pos.actvLtp || pos.ltp) || 0;
    const buyAvg = Number(pos.buyAvg) || 0;
    const netQty = Number(pos.netQty) || 0;
    const realizedPnl = Number(pos.realizedPnl) || 0;
    const unrealized = netQty !== 0 ? (liveLtp - buyAvg) * netQty : 0;
    const pnl = realizedPnl + unrealized;
    return acc + (isNaN(pnl) ? 0 : pnl);
  }, 0);

  const updateServerUrl = async (url: string) => {
    await saveServerUrl(url);
    setServerUrlState(url);
    refreshAllData();
  };

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await ApiService.getAccounts();
      if (Array.isArray(data)) setAccounts(data);
    } catch (e) {
      console.warn("Failed to fetch accounts", e);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const data = await ApiService.getOrders();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.warn("Failed to fetch orders", e);
    }
  }, []);

  const refreshPositions = useCallback(async () => {
    try {
      const data = await ApiService.getPositions();
      if (Array.isArray(data)) setPositions(data);
    } catch (e) {
      console.warn("Failed to fetch positions", e);
    }
  }, []);

  const refreshWatchlist = useCallback(async () => {
    try {
      const data = await ApiService.getWatchlist();
      if (Array.isArray(data)) setWatchlist(data);
    } catch (e) {
      console.warn("Failed to fetch watchlist", e);
    }
  }, []);

  const addToWatchlist = async (item: any) => {
    await ApiService.addToWatchlist(item);
    await refreshWatchlist();
  };

  const removeFromWatchlist = async (scriptToken: string) => {
    await ApiService.removeFromWatchlist(scriptToken);
    await refreshWatchlist();
  };

  const refreshSettings = useCallback(async () => {
    try {
      const data = await ApiService.getSettings();
      if (data) setSettings(data);
    } catch (e) {
      console.warn("Failed to fetch settings", e);
    }
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await ApiService.updateSettings(newSettings);
    } catch (e) {
      console.warn("Failed to save settings", e);
    }
  };

  const refreshLogs = useCallback(async () => {
    try {
      const data = await ApiService.getLogs();
      if (Array.isArray(data)) setLogs(data);
    } catch (e) {
      console.warn("Failed to fetch logs", e);
    }
  }, []);

  const refreshUpstoxStatus = useCallback(async () => {
    try {
      const data = await ApiService.getUpstoxStatus();
      if (data) {
        setUpstoxConnected(!!data.hasToken);
        if (data.authUrl) setUpstoxAuthUrl(data.authUrl);
      }
    } catch (e) {
      console.warn("Failed to fetch upstox status", e);
    }
  }, []);

  const refreshFeedCredentials = useCallback(async () => {
    try {
      const creds = await ApiService.getFeedCredentials();
      if (creds && creds.accessToken && creds.sid) {
        kotakFeed.connect(creds.accessToken, creds.sid, creds.serverId || "");
      }
    } catch (e) {
      console.warn("Failed to connect live feed", e);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setIsConnecting(true);
    try {
      await ApiService.getSystemStatus();
      setIsConnected(true);
      await Promise.all([
        refreshAccounts(),
        refreshOrders(),
        refreshPositions(),
        refreshWatchlist(),
        refreshSettings(),
        refreshLogs(),
        refreshUpstoxStatus(),
        refreshFeedCredentials(),
      ]);
    } catch (e) {
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [
    refreshAccounts,
    refreshOrders,
    refreshPositions,
    refreshWatchlist,
    refreshSettings,
    refreshLogs,
    refreshUpstoxStatus,
    refreshFeedCredentials,
  ]);

  // Initial load
  useEffect(() => {
    initServerUrl().then((url) => {
      setServerUrlState(url);
      refreshAllData();
    });
  }, [refreshAllData]);

  // Auto-subscribe to scrips in Watchlist, Positions, NIFTY 50, and SENSEX
  useEffect(() => {
    const tokens = new Set<string>();
    tokens.add("Nifty 50");
    tokens.add("SENSEX");

    watchlist.forEach((w) => {
      if (w.scriptToken) tokens.add(w.scriptToken);
    });

    positions.forEach((p: any) => {
      if (p.scriptToken) tokens.add(p.scriptToken);
      else if (p.symbol) tokens.add(p.symbol);
    });

    tokens.forEach((token) => {
      kotakFeed.subscribe(token);
    });
  }, [watchlist, positions]);

  // Periodic polling for fast updates (orders, positions, logs)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        refreshOrders();
        refreshPositions();
        refreshLogs();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isConnected, refreshOrders, refreshPositions, refreshLogs]);

  // Kotak WebSocket tick listener
  useEffect(() => {
    const unsub = kotakFeed.onTick((tick) => {
      if (!tick.tk || typeof tick.ltp !== "number") return;
      setQuotes((prev) => {
        const existing = prev[tick.tk] || { ltp: tick.ltp!, change: 0, changePct: 0 };
        const change = tick.cng ?? (existing.prevLtp ? tick.ltp! - existing.prevLtp : existing.change);
        const changePct = tick.nc ?? (existing.prevLtp ? (change / existing.prevLtp) * 100 : existing.changePct);
        return {
          ...prev,
          [tick.tk]: {
            ltp: tick.ltp!,
            change,
            changePct,
            prevLtp: existing.ltp,
            high: tick.h ?? existing.high,
            low: tick.lo ?? existing.low,
            open: tick.op ?? existing.open,
            close: tick.c ?? existing.close,
            volume: tick.v ?? existing.volume,
          },
        };
      });
    });
    return () => unsub();
  }, []);

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        updateServerUrl,
        isConnected,
        isConnecting,
        accounts,
        refreshAccounts,
        orders,
        refreshOrders,
        positions,
        refreshPositions,
        watchlist,
        refreshWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        settings,
        updateSettings,
        quotes,
        logs,
        refreshLogs,
        totalPnl,
        upstoxConnected,
        upstoxAuthUrl,
        refreshUpstoxStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
