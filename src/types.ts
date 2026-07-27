export interface AccountSummary {
  id: string;
  nickname: string;
  role: "master" | "slave";
  mobileNumber: string;
  ucc: string;
  multiplier: number;
  status: "active" | "expired" | "error" | "disconnected";
  lastLogin: string | null;
  errorMessage: string | null;
  createdAt: string;
  consumerKey?: string;
  mpin?: string;
  totpSecret?: string;
  hasConsumerKey: boolean;
  hasTotpSecret: boolean;
  hasAutoTotpSecret: boolean;
  hasMpin: boolean;
}

export interface TradeOrder {
  id: string;
  masterOrderId: string | null;
  accountId: string;
  accountName: string;
  accountRole: "master" | "slave";
  symbol: string;
  instrument: string;
  optionType: "CE" | "PE" | "FUT" | "EQ";
  strikePrice: number;
  expiry: string;
  quantity: number;
  price: number;
  orderType: "MARKET" | "LIMIT" | "SL" | "SL-M";
  productType?: "MIS" | "CNC" | "NRML";
  triggerPrice?: number;
  transactionType: "BUY" | "SELL";
  status: "SUCCESS" | "FAILED" | "PENDING" | "CANCELLED";
  errorMessage: string | null;
  timestamp: string;
}

export interface AppSettings {
  autoReplicate: boolean;
  autoRenewSessions: boolean;
}

export interface ScripInfo {
  scriptToken: string;
  tradingSymbol: string;
  scripRefKey: string;
  instrumentName: string;
  exchange: string;
  segment: string;
  strikePrice: number;
  expiry: string;
  lotSize: number;
}

export interface WatchlistItem extends ScripInfo {
  addedAt: string;
}

export interface QuoteData {
  ltp: number;
  change: number;
  changePct: number;
  prevLtp?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  volume?: number;
}

export interface Position {
  symbol: string;
  tradingSymbol: string;
  scripRefKey?: string;
  buyQty: number;
  sellQty: number;
  netQty: number;
  buyAvg: number;
  sellAvg: number;
  realizedPnl: number;
  unrealizedPnl?: number;
  actvLtp?: number;
  ltp?: number;
  accountName?: string;
  accountId?: string;
  productType?: string;
}

export interface OcoRule {
  id: string;
  symbol: string;
  targetPrice: number;
  stopLossPrice: number;
  productType: string;
  createdAt?: string;
}

export interface AccountMargin {
  accountId?: string;
  accountName?: string;
  cash?: number;
  totalMargin?: number;
  availableMargin?: number;
  usedMargin?: number;
  marginUsed?: number;
}

export interface SystemPower {
  active: boolean;
}

export interface ScripCategory {
  key: string;
  label: string;
  exchange: string;
  segment: string;
  count: number;
  isLoaded: boolean;
  url?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  source?: string;
}

