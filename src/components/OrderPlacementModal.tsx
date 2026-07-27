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
} from "react-native";
import { useApp } from "../context/AppContext";
import { ApiService } from "../services/api";
import { ScripInfo } from "../types";
import { X, Send, TrendingUp, TrendingDown } from "lucide-react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OrderPlacementModalProps {
  visible: boolean;
  initialScrip?: ScripInfo | any;
  initialSide?: "BUY" | "SELL";
  onClose: () => void;
}

export const OrderPlacementModal: React.FC<OrderPlacementModalProps> = ({
  visible,
  initialScrip,
  initialSide = "BUY",
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { accounts, refreshOrders, refreshPositions } = useApp();

  const [transactionType, setTransactionType] = useState<"BUY" | "SELL">(initialSide);
  const [symbol, setSymbol] = useState("");
  const [tradingSymbol, setTradingSymbol] = useState("");
  const [optionType, setOptionType] = useState<"CE" | "PE" | "FUT" | "EQ">("CE");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiry, setExpiry] = useState("");
  const [quantity, setQuantity] = useState("15"); // Default NIFTY lot size
  const [price, setPrice] = useState("0");
  const [triggerPrice, setTriggerPrice] = useState("0");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "SL">("MARKET");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialScrip) {
      setSymbol(initialScrip.scripRefKey || initialScrip.tradingSymbol || initialScrip.symbol || "");
      setTradingSymbol(initialScrip.tradingSymbol || "");
      if (initialScrip.strikePrice) setStrikePrice(String(initialScrip.strikePrice));
      if (initialScrip.expiry) setExpiry(initialScrip.expiry);
      if (initialScrip.lotSize) setQuantity(String(initialScrip.lotSize));
      if (initialScrip.instrumentName) {
        const inst = initialScrip.instrumentName.toUpperCase();
        if (inst.includes("CE")) setOptionType("CE");
        else if (inst.includes("PE")) setOptionType("PE");
        else if (inst.includes("FUT")) setOptionType("FUT");
        else setOptionType("EQ");
      }
    }
    setTransactionType(initialSide);
  }, [initialScrip, initialSide, visible]);

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
      const masterAcc = accounts.find((a) => a.role === "master");
      const targetAccId = selectedAccountId === "ALL" ? masterAcc?.id || accounts[0]?.id : selectedAccountId;

      const payload = {
        accountId: targetAccId,
        symbol: symbol.trim().toUpperCase(),
        tradingSymbol: tradingSymbol || symbol.trim().toUpperCase(),
        optionType,
        strikePrice: parseFloat(strikePrice) || 0,
        expiry: expiry || "",
        quantity: qtyNum,
        price: parseFloat(price) || 0,
        triggerPrice: parseFloat(triggerPrice) || 0,
        orderType,
        transactionType,
      };

      await ApiService.placeOrder(payload);
      await Promise.all([refreshOrders(), refreshPositions()]);
      setSubmitting(false);
      Alert.alert("Order Placed", `${transactionType} order for ${symbol} placed successfully!`);
      onClose();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert("Order Failed", e?.message || "Could not place order.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Order Ticket</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* BUY / SELL Switcher */}
            <View style={styles.sideSelector}>
              <TouchableOpacity
                style={[
                  styles.sideBtn,
                  transactionType === "BUY" && { backgroundColor: "#10b981" },
                ]}
                onPress={() => setTransactionType("BUY")}
              >
                <TrendingUp size={16} color={transactionType === "BUY" ? "#090d16" : "#10b981"} />
                <Text
                  style={[
                    styles.sideText,
                    transactionType === "BUY" && { color: "#090d16", fontWeight: "900" },
                  ]}
                >
                  BUY
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sideBtn,
                  transactionType === "SELL" && { backgroundColor: "#f43f5e" },
                ]}
                onPress={() => setTransactionType("SELL")}
              >
                <TrendingDown size={16} color={transactionType === "SELL" ? "#090d16" : "#f43f5e"} />
                <Text
                  style={[
                    styles.sideText,
                    transactionType === "SELL" && { color: "#090d16", fontWeight: "900" },
                  ]}
                >
                  SELL
                </Text>
              </TouchableOpacity>
            </View>

            {/* Symbol & Segment */}
            <Text style={styles.fieldLabel}>Symbol / Instrument</Text>
            <TextInput
              style={styles.textInput}
              value={symbol}
              onChangeText={setSymbol}
              placeholder="e.g. NIFTY24DEC24500CE"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />

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

            {/* Order Type */}
            <Text style={styles.fieldLabel}>Order Type</Text>
            <View style={styles.chipRow}>
              {(["MARKET", "LIMIT", "SL"] as const).map((type) => (
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

            {/* Quantity & Price Row */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.fieldLabel}>Quantity</Text>
                <TextInput
                  style={styles.textInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              {orderType !== "MARKET" && (
                <View style={styles.flex1}>
                  <Text style={styles.fieldLabel}>Limit Price (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>

            {orderType === "SL" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Trigger Price (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  value={triggerPrice}
                  onChangeText={setTriggerPrice}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Account Target */}
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
            <Send size={18} color="#090d16" />
            <Text style={styles.submitBtnText}>
              {submitting
                ? "Placing Order..."
                : `Confirm ${transactionType} Order`}
            </Text>
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
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    marginBottom: 16,
  },
  sideSelector: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  sideBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sideText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#f8fafc",
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
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
    fontWeight: "800",
    color: "#090d16",
  },
});
