import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { ApiService } from "../services/api";
import { ScripInfo } from "../types";
import {
  X,
  Send,
  TrendingUp,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OrderPlacementModalProps {
  visible: boolean;
  initialScrip?: ScripInfo | any;
  initialSide?: "BUY" | "SELL";
  onClose: () => void;
}

interface MarginAccountDetails {
  accountId: string;
  accountName: string;
  multiplier?: number;
  quantity?: number;
  requiredMargin: number;
  availableMargin: number;
  sufficient: boolean;
}

interface MarginDataResponse {
  unitPrice?: number;
  master?: MarginAccountDetails;
  slaves?: MarginAccountDetails[];
}

export const OrderPlacementModal: React.FC<OrderPlacementModalProps> = ({
  visible,
  initialScrip,
  initialSide = "BUY",
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { accounts, quotes, margins, refreshOrders, refreshPositions } = useApp();
  const { isLightTheme, colors } = useTheme();

  const [transactionType, setTransactionType] = useState<"BUY" | "SELL">(initialSide);
  const [symbol, setSymbol] = useState("");
  const [tradingSymbol, setTradingSymbol] = useState("");
  const [optionType, setOptionType] = useState<"CE" | "PE" | "FUT" | "EQ">("CE");
  const [productType, setProductType] = useState<"MIS" | "CNC" | "NRML">("MIS");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiry, setExpiry] = useState("");
  const [quantity, setQuantity] = useState("15");
  const [price, setPrice] = useState("0");
  const [triggerPrice, setTriggerPrice] = useState("0");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "SL" | "SL-M">("MARKET");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [submitting, setSubmitting] = useState(false);

  // Margin data state matching web app
  const [marginData, setMarginData] = useState<MarginDataResponse | null>(null);
  const [calculatingMargin, setCalculatingMargin] = useState(false);

  // Resolve live LTP from quotes stream or initialScrip
  const token = initialScrip?.scriptToken || initialScrip?.token || initialScrip?.pToken || "";
  const liveQuote = quotes[token] || (symbol ? quotes[symbol] : null);

  const rawLtp = liveQuote?.ltp ?? initialScrip?.ltp ?? initialScrip?.price ?? initialScrip?.close ?? 0;
  const ltp = typeof rawLtp === "number" ? rawLtp : parseFloat(rawLtp) || 0;
  const change = liveQuote?.change ?? initialScrip?.change ?? 0;
  const pChange = liveQuote?.pChange ?? liveQuote?.changePct ?? initialScrip?.pChange ?? initialScrip?.changePct ?? 0;

  useEffect(() => {
    if (initialScrip) {
      const sym = initialScrip.scripRefKey || initialScrip.tradingSymbol || initialScrip.symbol || "";
      setSymbol(sym);
      setTradingSymbol(initialScrip.tradingSymbol || sym);
      if (initialScrip.strikePrice) setStrikePrice(String(initialScrip.strikePrice));
      if (initialScrip.expiry) setExpiry(initialScrip.expiry);
      if (initialScrip.lotSize) setQuantity(String(initialScrip.lotSize));
      if (initialScrip.instrumentName) {
        const inst = String(initialScrip.instrumentName).toUpperCase();
        if (inst.includes("CE")) setOptionType("CE");
        else if (inst.includes("PE")) setOptionType("PE");
        else if (inst.includes("FUT")) setOptionType("FUT");
        else setOptionType("EQ");
      }
      const initialLtp = initialScrip.ltp || initialScrip.price || initialScrip.close || 0;
      if (initialLtp > 0) {
        setPrice(String(initialLtp));
        setTriggerPrice(String(initialLtp));
      }
    }
    setTransactionType(initialSide);
  }, [initialScrip, initialSide, visible]);

  // Sync price when orderType is MARKET and LTP changes
  useEffect(() => {
    if (orderType === "MARKET" && ltp > 0) {
      setPrice(String(ltp));
    }
  }, [orderType, ltp]);

  // Keep track of margin call in-flight & last execution timestamp for MARKET order 4sec throttling
  const isFetchingMargin = React.useRef<boolean>(false);
  const lastMarketMarginTime = React.useRef<number>(0);

  // Live Broker Margin Calculation (Debounced 300ms for user input changes)
  useEffect(() => {
    if (!visible || !symbol.trim()) return;
    const qtyNum = parseInt(quantity, 10) || 0;
    if (qtyNum <= 0) return;

    const priceVal = orderType === "MARKET" ? ltp : parseFloat(price) || 0;
    if (orderType === "MARKET" && priceVal <= 0) return;

    let active = true;

    // Throttle for MARKET orders to at most once per 4 seconds
    if (orderType === "MARKET") {
      const now = Date.now();
      if (isFetchingMargin.current || (now - lastMarketMarginTime.current < 4000)) {
        return;
      }
    }

    isFetchingMargin.current = true;
    setCalculatingMargin(true);

    const timer = setTimeout(() => {
      ApiService.calculateMarginRequired({
        scriptToken: token || initialScrip?.scriptToken || symbol.trim().toUpperCase(),
        instrumentToken: token || initialScrip?.scriptToken || symbol.trim().toUpperCase(),
        exchange: initialScrip?.exchange || "NFO",
        segment: initialScrip?.segment || "NFO",
        symbol: symbol.trim().toUpperCase(),
        quantity: qtyNum,
        price: priceVal,
        triggerPrice: parseFloat(triggerPrice) || 0,
        product: productType,
        orderType,
        transactionType,
      })
        .then((data) => {
          if (active && data) {
            setMarginData(data);
          }
        })
        .catch(() => {
          if (active) setMarginData(null);
        })
        .finally(() => {
          if (active) {
            setCalculatingMargin(false);
            isFetchingMargin.current = false;
            lastMarketMarginTime.current = Date.now();
          }
        });
    }, orderType === "MARKET" ? 0 : 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [symbol, quantity, price, triggerPrice, productType, orderType, transactionType, visible]);

  // Periodic 4-second refresh for MARKET orders
  useEffect(() => {
    if (!visible || orderType !== "MARKET" || !symbol.trim()) return;

    const interval = setInterval(() => {
      const qtyNum = parseInt(quantity, 10) || 0;
      if (qtyNum <= 0 || ltp <= 0) return;

      const now = Date.now();
      if (isFetchingMargin.current || (now - lastMarketMarginTime.current < 4000)) {
        return;
      }

      isFetchingMargin.current = true;
      setCalculatingMargin(true);

      ApiService.calculateMarginRequired({
        scriptToken: token || initialScrip?.scriptToken || symbol.trim().toUpperCase(),
        instrumentToken: token || initialScrip?.scriptToken || symbol.trim().toUpperCase(),
        exchange: initialScrip?.exchange || "NFO",
        segment: initialScrip?.segment || "NFO",
        symbol: symbol.trim().toUpperCase(),
        quantity: qtyNum,
        price: ltp,
        triggerPrice: parseFloat(triggerPrice) || 0,
        product: productType,
        orderType: "MARKET",
        transactionType,
      })
        .then((data) => {
          if (data) setMarginData(data);
        })
        .catch(() => {})
        .finally(() => {
          setCalculatingMargin(false);
          isFetchingMargin.current = false;
          lastMarketMarginTime.current = Date.now();
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [visible, orderType, symbol, quantity, triggerPrice, productType, transactionType, ltp, token, initialScrip]);

  const masterAcc = accounts.find((a) => a.role === "master");
  const slaveAccs = accounts.filter((a) => a.role === "slave" && a.status === "active");

  const masterQtyNum = parseInt(quantity, 10) || 0;
  const unitPrice = orderType === "MARKET" ? ltp : parseFloat(price) || 0;

  // Master Margin Metrics
  const masterReq = marginData?.master?.requiredMargin ?? masterQtyNum * unitPrice;
  const masterAvail =
    marginData?.master?.availableMargin ??
    (margins.find((m) => m.accountId === masterAcc?.id || m.role === "master")?.availableMargin || 0);
  const masterSuff = marginData?.master?.sufficient ?? masterAvail >= masterReq;

  // Projected Trade Exposure Metrics
  const masterTradeValue = masterQtyNum * unitPrice;
  let totalSlaveQty = 0;
  slaveAccs.forEach((s) => {
    const mult = s.multiplier || 1;
    totalSlaveQty += Math.max(1, Math.round(masterQtyNum * mult));
  });
  const totalCombinedQty = masterQtyNum + totalSlaveQty;
  const totalCombinedValue = totalCombinedQty * unitPrice;
  const pnlPerPointMaster = masterQtyNum;
  const pnlPerPointTotal = totalCombinedQty;

  const fmt = (val: number) =>
    val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePlaceOrder = async () => {
    if (!symbol.trim()) {
      Alert.alert("Missing Symbol", "Please specify a valid symbol or scrip.");
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid order quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const targetAccId = selectedAccountId === "ALL" ? masterAcc?.id || accounts[0]?.id : selectedAccountId;

      const payload = {
        accountId: targetAccId,
        symbol: symbol.trim().toUpperCase(),
        instrument: symbol.trim().toUpperCase(),
        tradingSymbol: tradingSymbol || symbol.trim().toUpperCase(),
        optionType,
        strikePrice: parseFloat(strikePrice) || 0,
        expiry: expiry || "",
        quantity: qtyNum,
        price: parseFloat(price) || 0,
        triggerPrice: parseFloat(triggerPrice) || 0,
        orderType,
        productType,
        transactionType,
      };

      await ApiService.placeOrder(payload);
      setSubmitting(false);
      Alert.alert("Order Placed", `${transactionType} ${productType} order for ${symbol} placed successfully!`);
      onClose();
      Promise.all([refreshOrders(), refreshPositions()]).catch(() => {});
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert("Order Failed", e?.message || "Could not place order.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Order Ticket</Text>
              <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{symbol || "Select Scrip"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.cardBgSecondary }]}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Live Price / LTP Header Card */}
            <View style={[styles.ltpHeaderCard, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}>
              <View style={styles.ltpLeftCol}>
                <Text style={[styles.ltpLabel, { color: colors.textSecondary }]}>Live LTP</Text>
                <View style={styles.ltpPriceRow}>
                  <Text style={[styles.ltpPriceText, { color: colors.textPrimary }]}>{ltp > 0 ? `₹${fmt(ltp)}` : "₹ --"}</Text>
                  {change !== 0 && (
                    <View style={[styles.changeBadge, { backgroundColor: change >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)" }]}>
                      {change >= 0 ? <ArrowUpRight size={13} color="#10b981" /> : <ArrowDownRight size={13} color="#f43f5e" />}
                      <Text style={[styles.changeBadgeText, { color: change >= 0 ? "#10b981" : "#f43f5e" }]}>
                        {change >= 0 ? "+" : ""}{fmt(change)} ({pChange >= 0 ? "+" : ""}{pChange.toFixed(2)}%)
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.ltpRightCol}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE FEED</Text>
                </View>
              </View>
            </View>

            {/* BUY Order Tag */}
            <View style={styles.sideSelector}>
              <View style={styles.sideBtn}>
                <TrendingUp size={16} color="#090d16" />
                <Text style={styles.sideText}>BUY ORDER</Text>
              </View>
            </View>

            {/* Symbol Input */}
            <Text style={styles.fieldLabel}>Symbol / Instrument</Text>
            <TextInput
              style={styles.textInput}
              value={symbol}
              onChangeText={setSymbol}
              placeholder="e.g. NIFTY24DEC24500CE"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />

            {/* Option / Segment Type */}
            <Text style={styles.fieldLabel}>Option / Segment Type</Text>
            <View style={styles.chipRow}>
              {(["CE", "PE", "FUT", "EQ"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, optionType === type && styles.activeChip]}
                  onPress={() => setOptionType(type)}
                >
                  <Text style={[styles.chipText, optionType === type && styles.activeChipText]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Product Type */}
            <Text style={styles.fieldLabel}>Product Type</Text>
            <View style={styles.chipRow}>
              {(["MIS", "CNC", "NRML"] as const).map((prod) => (
                <TouchableOpacity
                  key={prod}
                  style={[styles.chip, productType === prod && styles.activeChip]}
                  onPress={() => setProductType(prod)}
                >
                  <Text style={[styles.chipText, productType === prod && styles.activeChipText]}>
                    {prod}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Order Type */}
            <Text style={styles.fieldLabel}>Order Type</Text>
            <View style={styles.chipRow}>
              {(["MARKET", "LIMIT", "SL", "SL-M"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, orderType === type && styles.activeChip]}
                  onPress={() => setOrderType(type)}
                >
                  <Text style={[styles.chipText, orderType === type && styles.activeChipText]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity Controls (Multiples of Lot Size) */}
            {(() => {
              const lotSize = initialScrip?.lotSize && initialScrip.lotSize > 0 ? initialScrip.lotSize : 15;
              const currentQty = parseInt(quantity, 10) || lotSize;
              const lotCount = Math.max(1, Math.round(currentQty / lotSize));

              return (
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Quantity (Lot Size: {lotSize})</Text>
                    <Text style={styles.lotBadgeText}>{lotCount} Lot(s)</Text>
                  </View>

                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => {
                        const next = Math.max(lotSize, currentQty - lotSize);
                        setQuantity(String(next));
                      }}
                    >
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.textInput, styles.stepperInput]}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                    />

                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => {
                        const next = currentQty + lotSize;
                        setQuantity(String(next));
                      }}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Lot Multiplier Chips */}
                  <View style={styles.quickLotRow}>
                    {[1, 2, 3, 4, 5].map((multiplier) => {
                      const targetQty = lotSize * multiplier;
                      const isSelected = currentQty === targetQty;
                      return (
                        <TouchableOpacity
                          key={multiplier}
                          style={[styles.quickLotChip, isSelected && styles.quickLotChipActive]}
                          onPress={() => setQuantity(String(targetQty))}
                        >
                          <Text style={[styles.quickLotText, isSelected && styles.quickLotTextActive]}>
                            {multiplier}x ({targetQty})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })()}

            {/* Price Inputs */}
            {orderType !== "MARKET" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Limit Price (₹)</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const curr = parseFloat(price) || 0;
                      setPrice(Math.max(0, (curr - 0.05)).toFixed(2));
                    }}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.textInput, styles.stepperInput]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const curr = parseFloat(price) || 0;
                      setPrice((curr + 0.05).toFixed(2));
                    }}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {orderType === "SL" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Trigger Price (₹)</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const curr = parseFloat(triggerPrice) || 0;
                      setTriggerPrice(Math.max(0, (curr - 0.05)).toFixed(2));
                    }}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.textInput, styles.stepperInput]}
                    value={triggerPrice}
                    onChangeText={setTriggerPrice}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const curr = parseFloat(triggerPrice) || 0;
                      setTriggerPrice((curr + 0.05).toFixed(2));
                    }}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── PROJECTED TRADE & P&L SENSITIVITY CARD ── */}
            {unitPrice > 0 && masterQtyNum > 0 && (
              <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <PieChart size={14} color="#06b6d4" />
                  <Text style={styles.cardHeaderTitle}>Projected Trade & Exposure</Text>
                </View>

                <View style={styles.pnlGrid}>
                  <View style={styles.pnlGridItem}>
                    <Text style={styles.pnlGridLabel}>Est. Order Value</Text>
                    <Text style={styles.pnlGridValue}>₹{fmt(masterTradeValue)}</Text>
                  </View>
                  <View style={styles.pnlGridItem}>
                    <Text style={styles.pnlGridLabel}>Total Copied Value</Text>
                    <Text style={styles.pnlGridValue}>₹{fmt(totalCombinedValue)}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.pnlSensitivityRow}>
                  <Text style={styles.pnlSensitivityLabel}>P&L per +1 Pt Move:</Text>
                  <View style={styles.pnlBadgeGroup}>
                    <Text style={styles.pnlBadgeGreen}>+₹{fmt(pnlPerPointMaster)} (Master)</Text>
                    {totalSlaveQty > 0 && (
                      <Text style={styles.pnlBadgeSub}>+₹{fmt(pnlPerPointTotal)} (Total)</Text>
                    )}
                  </View>
                </View>
                <View style={styles.pnlSensitivityRow}>
                  <Text style={styles.pnlSensitivityLabel}>P&L per -1 Pt Move:</Text>
                  <View style={styles.pnlBadgeGroup}>
                    <Text style={styles.pnlBadgeRed}>-₹{fmt(pnlPerPointMaster)} (Master)</Text>
                    {totalSlaveQty > 0 && (
                      <Text style={styles.pnlBadgeSub}>-₹{fmt(pnlPerPointTotal)} (Total)</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* ── BROKER LIVE MARGIN REQUIREMENT BREAKDOWN ── */}
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Wallet size={14} color="#38bdf8" />
                <Text style={styles.cardHeaderTitle}>Broker Live Margin Check</Text>
                {calculatingMargin ? (
                  <View style={styles.loadingMarginBadge}>
                    <ActivityIndicator size="small" color="#38bdf8" />
                    <Text style={styles.loadingMarginText}>Calculating...</Text>
                  </View>
                ) : (
                  unitPrice > 0 && (
                    <Text style={styles.unitPriceBadge}>Price: ₹{fmt(unitPrice)}</Text>
                  )
                )}
              </View>

              {/* Master Account Funds Breakdown */}
              <View style={styles.accountMarginBox}>
                <View style={styles.accMarginHeaderRow}>
                  <Text style={styles.accMarginName}>
                    Master ({masterAcc?.nickname || "Master Account"}):
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: masterSuff ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                        borderColor: masterSuff ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)",
                      },
                    ]}
                  >
                    {masterSuff ? <CheckCircle2 size={10} color="#10b981" /> : <AlertTriangle size={10} color="#f43f5e" />}
                    <Text style={[styles.statusPillText, { color: masterSuff ? "#10b981" : "#f43f5e" }]}>
                      {masterSuff ? "Sufficient Funds" : "Insufficient Margin"}
                    </Text>
                  </View>
                </View>
                <View style={styles.accMarginDetailsRow}>
                  <Text style={styles.accMarginText}>
                    Req: <Text style={styles.boldText}>₹{fmt(masterReq)}</Text> ({masterQtyNum} qty)
                  </Text>
                  <Text style={styles.accMarginText}>
                    Avail: <Text style={styles.boldText}>₹{fmt(masterAvail)}</Text>
                  </Text>
                </View>
              </View>

              {/* Slave Accounts Funds Breakdown */}
              {slaveAccs.length > 0 && (
                <View style={styles.slaveMarginSection}>
                  <Text style={styles.slaveSectionTitle}>SLAVE COPYING MARGIN STATUS</Text>
                  {slaveAccs.map((s) => {
                    const slaveApiData = marginData?.slaves?.find((sl) => sl.accountId === s.id);
                    const slaveQty =
                      slaveApiData?.quantity ?? Math.max(1, Math.round(masterQtyNum * (s.multiplier || 1)));
                    const slaveReq = slaveApiData?.requiredMargin ?? slaveQty * unitPrice;
                    const sMargin = margins.find((m) => m.accountId === s.id || m.accountName === s.nickname);
                    const slaveAvail =
                      slaveApiData?.availableMargin ?? (sMargin ? Number(sMargin.availableMargin || 0) : 0);
                    const sSuff = slaveApiData?.sufficient ?? slaveAvail >= slaveReq;

                    return (
                      <View key={s.id} style={styles.slaveMarginBox}>
                        <View style={styles.accMarginHeaderRow}>
                          <Text style={styles.slaveMarginName}>
                            {s.nickname} ({s.multiplier || 1}x — {slaveQty} qty):
                          </Text>
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor: sSuff ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                                borderColor: sSuff ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)",
                              },
                            ]}
                          >
                            <Text style={[styles.statusPillText, { color: sSuff ? "#10b981" : "#f43f5e" }]}>
                              {sSuff ? "Sufficient" : "Margin Shortfall"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.accMarginDetailsRow}>
                          <Text style={styles.accMarginText}>
                            Req: <Text style={styles.boldText}>₹{fmt(slaveReq)}</Text>
                          </Text>
                          <Text style={styles.accMarginText}>
                            Avail: <Text style={styles.boldText}>₹{fmt(slaveAvail)}</Text>
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Execution Scope */}
            <Text style={styles.fieldLabel}>Execution Scope</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, selectedAccountId === "ALL" && styles.activeChip]}
                onPress={() => setSelectedAccountId("ALL")}
              >
                <Text style={[styles.chipText, selectedAccountId === "ALL" && styles.activeChipText]}>
                  Master + Slaves
                </Text>
              </TouchableOpacity>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.chip, selectedAccountId === acc.id && styles.activeChip]}
                  onPress={() => setSelectedAccountId(acc.id)}
                >
                  <Text style={[styles.chipText, selectedAccountId === acc.id && styles.activeChipText]}>
                    {acc.nickname} ({acc.role})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: transactionType === "BUY" ? "#10b981" : "#f43f5e" },
            ]}
            onPress={handlePlaceOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#090d16" />
            ) : (
              <>
                <Send size={18} color="#090d16" />
                <Text style={styles.submitBtnText}>Confirm {transactionType} Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 20,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#38bdf8",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    marginBottom: 12,
  },
  ltpHeaderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#161e31",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 12,
  },
  ltpLeftCol: {
    flex: 1,
  },
  ltpRightCol: {
    alignItems: "flex-end",
  },
  ltpLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  ltpPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  ltpPriceText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f8fafc",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  liveText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10b981",
    letterSpacing: 0.5,
  },
  sideSelector: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  sideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sideText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#090d16",
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#f8fafc",
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeChip: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "#06b6d4",
  },
  chipText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  activeChipText: {
    color: "#38bdf8",
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 4,
  },
  cardContainer: {
    backgroundColor: "#161e31",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f8fafc",
    flex: 1,
    marginLeft: 6,
  },
  loadingMarginBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loadingMarginText: {
    fontSize: 10,
    color: "#38bdf8",
    fontWeight: "600",
  },
  unitPriceBadge: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
  },
  pnlGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  pnlGridItem: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  pnlGridLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },
  pnlGridValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#38bdf8",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 8,
  },
  pnlSensitivityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  pnlSensitivityLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  pnlBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pnlBadgeGreen: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10b981",
  },
  pnlBadgeRed: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f43f5e",
  },
  pnlBadgeSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  accountMarginBox: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 8,
    marginTop: 4,
  },
  accMarginHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  accMarginName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
  },
  accMarginDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accMarginText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  boldText: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  slaveMarginSection: {
    marginTop: 8,
  },
  slaveSectionTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  slaveMarginBox: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 8,
    marginBottom: 4,
  },
  slaveMarginName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#090d16",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lotBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38bdf8",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#38bdf8",
  },
  stepperInput: {
    flex: 1,
    textAlign: "center",
  },
  quickLotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  quickLotChip: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickLotChipActive: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "#06b6d4",
  },
  quickLotText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  quickLotTextActive: {
    color: "#38bdf8",
    fontWeight: "800",
  },
});
