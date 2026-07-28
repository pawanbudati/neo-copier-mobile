import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
} from "../types";
import { ApiService, initServerUrl, getServerUrl, setServerUrl as saveServerUrl } from "../services/api";
import { quoteStream } from "../services/quoteStream";
import { KotakLiveFeed } from "../services/kotakWebSocket";

interface AppContextType {
  serverUrl: string;
  updateServerUrl: (url: string) => Promise<void>;
  isConnected: boolean;
  isConnecting: boolean;

  masterPowerActive: boolean;
  toggleMasterPower: (active: boolean) => Promise<void>;

  accounts: AccountSummary[];
  refreshAccounts: () => Promise<void>;

  margins: AccountMargin[];
  refreshMargins: () => Promise<void>;

  orders: TradeOrder[];
  refreshOrders: () => Promise<void>;

  positions: Position[];
  refreshPositions: () => Promise<void>;

  ocoRules: OcoRule[];
  refreshOcoRules: () => Promise<void>;
  createOcoRule: (rule: { symbol: string; targetPrice: number; stopLossPrice: number; productType?: string }) => Promise<void>;
  deleteOcoRule: (id: string) => Promise<void>;

  watchlist: WatchlistItem[];
  refreshWatchlist: () => Promise<void>;
  addToWatchlist: (item: any) => Promise<void>;
  removeFromWatchlist: (scriptToken: string) => Promise<void>;

  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  quotes: Record<string, QuoteData>;
  subscribeToTokens: (tokens: string[]) => Promise<void>;
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

  const [masterPowerActive, setMasterPowerActive] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [margins, setMargins] = useState<AccountMargin[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [ocoRules, setOcoRules] = useState<OcoRule[]>([]);
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

  const refreshSystemPower = useCallback(async () => {
    try {
      const res = await ApiService.getSystemPower();
      if (res && typeof res.active === "boolean") {
        setMasterPowerActive(res.active);
      }
    } catch (e) {
      console.warn("Failed to fetch system power status", e);
    }
  }, []);

  const toggleMasterPower = async (active: boolean) => {
    setMasterPowerActive(active);
    try {
      const res = await ApiService.setSystemPower(active);
      if (res && typeof res.active === "boolean") {
        setMasterPowerActive(res.active);
      }
    } catch (e) {
      console.warn("Failed to set system power status", e);
    }
  };

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await ApiService.getAccounts();
      if (Array.isArray(data)) setAccounts(data);
    } catch (e) {
      console.warn("Failed to fetch accounts", e);
    }
  }, []);

  const refreshMargins = useCallback(async () => {
    try {
      const data = await ApiService.getMargins();
      if (Array.isArray(data)) setMargins(data);
    } catch (e) {
      console.warn("Failed to fetch margins", e);
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

  const refreshOcoRules = useCallback(async () => {
    try {
      const data = await ApiService.getActiveOcoRules();
      if (Array.isArray(data)) setOcoRules(data);
    } catch (e) {
      console.warn("Failed to fetch OCO rules", e);
    }
  }, []);

  const createOcoRule = async (rule: { symbol: string; targetPrice: number; stopLossPrice: number; productType?: string }) => {
    await ApiService.createOcoRule(rule);
    await refreshOcoRules();
  };

  const deleteOcoRule = async (id: string) => {
    await ApiService.deleteOcoRule(id);
    await refreshOcoRules();
  };

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
      await ApiService.getFeedCredentials();
    } catch (e) {
      console.warn("Failed to fetch feed credentials", e);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setIsConnecting(true);
    try {
      await ApiService.getSystemStatus();
      setIsConnected(true);
      await Promise.all([
        refreshSystemPower(),
        refreshAccounts(),
        refreshMargins(),
        refreshOrders(),
        refreshPositions(),
        refreshOcoRules(),
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
    refreshSystemPower,
    refreshAccounts,
    refreshMargins,
    refreshOrders,
    refreshPositions,
    refreshOcoRules,
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

  const feedRef = React.useRef<KotakLiveFeed | null>(null);

  const mapToNeoExchange = (exch?: string): string => {
    if (!exch) return "nse_cm";
    const e = exch.toLowerCase();
    if (e.includes("nse_fo") || e.includes("nse_df") || e.includes("fo")) return "nse_fo";
    if (e.includes("bse_fo")) return "bse_fo";
    if (e.includes("bse")) return "bse_cm";
    return "nse_cm";
  };

  const lookupInstrument = useCallback((token: string) => {
    if (token === "Nifty 50" || token === "NIFTY" || token === "26000" || token === "NIFTY 50") {
      return { exchange_segment: "nse_cm", instrument_token: "Nifty 50", isIndex: true };
    }
    if (token === "SENSEX" || token === "Sensex" || token === "1") {
      return { exchange_segment: "bse_cm", instrument_token: "SENSEX", isIndex: true };
    }

    const watchItem = watchlist.find((w) => w.scriptToken === token);
    if (watchItem) {
      return {
        exchange_segment: mapToNeoExchange(watchItem.exchange),
        instrument_token: token,
        isIndex: false,
      };
    }

    for (const acc of positions) {
      const posItem = (acc as any).scriptToken === token || (acc as any).symbol === token ? acc : null;
      if (posItem) {
        return {
          exchange_segment: mapToNeoExchange((posItem as any).exchange),
          instrument_token: token,
          isIndex: false,
        };
      }
    }

    return { exchange_segment: "nse_cm", instrument_token: token, isIndex: false };
  }, [watchlist, positions]);

  const subscribeToTokens = useCallback(async (tokens: string[]) => {
    const uniqueTokens = [...new Set(tokens.filter(Boolean))];
    if (!uniqueTokens.length) return;

    try {
      let feed = feedRef.current;
      if (!feed) {
        const creds = await ApiService.getFeedCredentials();
        if (creds && creds.accessToken && creds.sid) {
          feed = new KotakLiveFeed({
            accessToken: creds.accessToken,
            sid: creds.sid,
            serverId: creds.serverId,
            dataCenter: creds.dataCenter,
          });

          feed.onTick((tick) => {
            setQuotes((prev) => {
              const next = { ...prev };
              const qData: QuoteData = {
                ltp: tick.ltp,
                change: tick.change,
                changePct: tick.changePct,
                prevLtp: prev[tick.token]?.ltp,
              };
              next[tick.token] = qData;

              // Index alias mapping
              if (tick.token === "Nifty 50" || tick.token === "26000" || tick.token === "NIFTY") {
                next["Nifty 50"] = qData;
                next["NIFTY"] = qData;
                next["NIFTY50"] = qData;
                next["26000"] = qData;
              } else if (tick.token === "SENSEX" || tick.token === "1" || tick.token === "Sensex") {
                next["SENSEX"] = qData;
                next["Sensex"] = qData;
                next["1"] = qData;
              }
              return next;
            });
          });

          feed.connect();
          feedRef.current = feed;
        }
      }

      if (feed) {
        const insts: any[] = [];
        const idxs: any[] = [];
        for (const t of uniqueTokens) {
          const inst = lookupInstrument(t);
          if (inst.isIndex) {
            idxs.push({ exchange_segment: inst.exchange_segment, instrument_token: inst.instrument_token });
          } else {
            insts.push({ exchange_segment: inst.exchange_segment, instrument_token: inst.instrument_token });
          }
        }
        if (idxs.length) feed.subscribe(idxs, true);
        if (insts.length) feed.subscribe(insts, false);
      }
    } catch (e) {
      console.warn("Direct KotakLiveFeed subscription error:", e);
    }

    if (serverUrl) {
      quoteStream.subscribe(serverUrl, uniqueTokens);
    }
  }, [lookupInstrument, serverUrl]);

  // Auto-subscribe to scrips in Watchlist, Positions, NIFTY 50, and SENSEX via direct WebSocket & quoteStream
  useEffect(() => {
    if (!isConnected) return;

    const tokens = new Set<string>();
    tokens.add("Nifty 50");
    tokens.add("SENSEX");
    tokens.add("26000");
    tokens.add("1");

    watchlist.forEach((w) => {
      if (w.scriptToken) tokens.add(w.scriptToken);
      if (w.tradingSymbol) tokens.add(w.tradingSymbol);
    });

    positions.forEach((p: any) => {
      if (p.scriptToken) tokens.add(p.scriptToken);
      if (p.symbol) tokens.add(p.symbol);
    });

    subscribeToTokens(Array.from(tokens));
  }, [isConnected, watchlist, positions, subscribeToTokens]);

  // Periodic polling for fast updates (orders, positions, logs, margins, power)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        refreshOrders();
        refreshPositions();
        refreshMargins();
        refreshOcoRules();
        refreshLogs();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isConnected, refreshOrders, refreshPositions, refreshMargins, refreshOcoRules, refreshLogs]);

  // Live QuoteStream tick listener
  useEffect(() => {
    const unsub = quoteStream.onQuotes((incomingQuotes) => {
      setQuotes((prev) => {
        const next = { ...prev };
        for (const [key, q] of Object.entries(incomingQuotes)) {
          if (!q || typeof q.ltp !== "number") continue;
          const ltpVal = Number(q.ltp);
          if (isNaN(ltpVal) || ltpVal <= 0) continue;

          const existing = next[key] || prev[key] || { ltp: ltpVal, change: 0, changePct: 0 };
          const change = typeof q.change === "number" ? q.change : (existing.prevLtp ? ltpVal - existing.prevLtp : existing.change);
          const changePct = typeof q.changePct === "number" ? q.changePct : (existing.prevLtp && existing.prevLtp !== 0 ? (change / existing.prevLtp) * 100 : existing.changePct);

          const updatedQuote: QuoteData = {
            ltp: ltpVal,
            change,
            changePct,
            prevLtp: existing.ltp,
            high: q.high ?? existing.high,
            low: q.low ?? existing.low,
            open: q.open ?? existing.open,
            close: q.close ?? existing.close,
            volume: q.volume ?? existing.volume,
          };

          next[key] = updatedQuote;

          // Register quote under all alias keys (token, symbol, trading_symbol)
          if (q.token && q.token !== key) next[q.token] = updatedQuote;
          if (q.symbol && q.symbol !== key) next[q.symbol] = updatedQuote;
          if (q.trading_symbol && q.trading_symbol !== key) next[q.trading_symbol] = updatedQuote;

          // Index alias mapping
          if (key === "26000" || q.token === "26000" || q.symbol === "Nifty 50") {
            next["26000"] = updatedQuote;
            next["Nifty 50"] = updatedQuote;
            next["NIFTY"] = updatedQuote;
            next["NIFTY50"] = updatedQuote;
          } else if (key === "1" || q.token === "1" || q.symbol === "SENSEX") {
            next["1"] = updatedQuote;
            next["SENSEX"] = updatedQuote;
            next["Sensex"] = updatedQuote;
          }
        }
        return next;
      });
    });

    return () => {
      unsub();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        updateServerUrl,
        isConnected,
        isConnecting,
        masterPowerActive,
        toggleMasterPower,
        accounts,
        refreshAccounts,
        margins,
        refreshMargins,
        orders,
        refreshOrders,
        positions,
        refreshPositions,
        ocoRules,
        refreshOcoRules,
        createOcoRule,
        deleteOcoRule,
        watchlist,
        refreshWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        settings,
        updateSettings,
        quotes,
        subscribeToTokens,
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
