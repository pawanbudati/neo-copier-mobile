import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useApp } from "../context/AppContext";
import { ApiService } from "../services/api";
import { TradeOrder } from "../types";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  RotateCcw,
  RefreshCw,
  Trash2,
  Edit3,
  Zap,
  X,
  Save,
} from "lucide-react-native";

export const OrdersScreen: React.FC = () => {
  const { orders, refreshOrders } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Modify Order Modal State
  const [modifyingOrder, setModifyingOrder] = useState<TradeOrder | null>(null);
  const [modifyQty, setModifyQty] = useState("");
  const [modifyPrice, setModifyPrice] = useState("");
  const [modifyType, setModifyType] = useState<"MARKET" | "LIMIT" | "SL">("LIMIT");
  const [submittingModify, setSubmittingModify] = useState(false);

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = filterStatus === "ALL" || ord.status === filterStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      ord.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      const res = await ApiService.syncOrdersStatus();
      await refreshOrders();
      setSyncing(false);
      Alert.alert("Orders Synced", `Updated status for ${res.updated || 0} pending orders.`);
    } catch (e: any) {
      setSyncing(false);
      Alert.alert("Sync Error", e?.message || "Failed to sync order statuses.");
    }
  };

  const handleClearAllOrders = async () => {
    Alert.alert("Clear All Orders", "Are you sure you want to clear the entire order history log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          try {
            await ApiService.clearOrders();
            await refreshOrders();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Could not clear orders.");
          }
        },
      },
    ]);
  };

  const handleDeleteOrder = async (orderId: string) => {
    Alert.alert("Delete Order Record", "Delete this order record from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await ApiService.deleteOrder(orderId);
            await refreshOrders();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Could not delete order.");
          }
        },
      },
    ]);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await ApiService.cancelOrder(orderId);
      await refreshOrders();
      Alert.alert("Order Cancelled", "Order cancellation request sent.");
    } catch (e: any) {
      Alert.alert("Cancel Failed", e?.message || "Could not cancel order.");
    }
  };

  const handleOpenModify = (ord: TradeOrder) => {
    setModifyingOrder(ord);
    setModifyQty(String(ord.quantity));
    setModifyPrice(String(ord.price || 0));
    setModifyType(ord.orderType as any);
  };

  const handleConfirmModify = async () => {
    if (!modifyingOrder) return;
    const qty = parseInt(modifyQty, 10);
    const prc = parseFloat(modifyPrice);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity.");
      return;
    }

    setSubmittingModify(true);
    try {
      await ApiService.modifyOrder(modifyingOrder.id, {
        quantity: qty,
        price: isNaN(prc) ? 0 : prc,
        orderType: modifyType,
      });
      await refreshOrders();
      setSubmittingModify(false);
      setModifyingOrder(null);
      Alert.alert("Order Modified", `Order ${modifyingOrder.symbol} updated successfully.`);
    } catch (e: any) {
      setSubmittingModify(false);
      Alert.alert("Modify Failed", e?.message || "Could not modify order.");
    }
  };

  const renderStatusBadge = (status: TradeOrder["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <View style={[styles.statusChip, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
            <CheckCircle size={12} color="#10b981" />
            <Text style={[styles.statusText, { color: "#10b981" }]}>SUCCESS</Text>
          </View>
        );
      case "FAILED":
        return (
          <View style={[styles.statusChip, { backgroundColor: "rgba(244, 63, 94, 0.15)" }]}>
            <XCircle size={12} color="#f43f5e" />
            <Text style={[styles.statusText, { color: "#f43f5e" }]}>FAILED</Text>
          </View>
        );
      case "PENDING":
        return (
          <View style={[styles.statusChip, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
            <Clock size={12} color="#f59e0b" />
            <Text style={[styles.statusText, { color: "#f59e0b" }]}>PENDING</Text>
          </View>
        );
      case "CANCELLED":
        return (
          <View style={[styles.statusChip, { backgroundColor: "rgba(100, 116, 139, 0.15)" }]}>
            <Ban size={12} color="#64748b" />
            <Text style={[styles.statusText, { color: "#64748b" }]}>CANCELLED</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Controls */}
      <View style={styles.headerControls}>
        <View style={styles.topControlRow}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search orders..."
              placeholderTextColor="#64748b"
            />
          </View>

          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncOrders} disabled={syncing}>
            <RefreshCw size={14} color="#06b6d4" />
            <Text style={styles.syncBtnText}>{syncing ? "Syncing..." : "Sync"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAllOrders}>
            <Trash2 size={14} color="#f43f5e" />
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={["ALL", "SUCCESS", "FAILED", "PENDING", "CANCELLED"]}
          keyExtractor={(item, idx) => String(item || idx)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filterStatus === item && styles.activeFilterChip]}
              onPress={() => setFilterStatus(item)}
            >
              <Text style={[styles.filterChipText, filterStatus === item && styles.activeFilterText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item, idx) => String(item.id || idx)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isBuy = item.transactionType === "BUY";
          const priceNum = Number(item.price);

          return (
            <View style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <View style={styles.symbolCol}>
                  <View style={styles.symbolRow}>
                    <View
                      style={[
                        styles.sideTag,
                        { backgroundColor: isBuy ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)" },
                      ]}
                    >
                      <Text style={[styles.sideTagText, { color: isBuy ? "#10b981" : "#f43f5e" }]}>
                        {item.transactionType}
                      </Text>
                    </View>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                    {item.productType && (
                      <View style={styles.prodTag}>
                        <Text style={styles.prodTagText}>{item.productType}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.accountSubText}>
                    Account: {item.accountName} ({item.accountRole})
                  </Text>
                </View>

                <View style={styles.headerRightCol}>
                  {renderStatusBadge(item.status)}
                  <TouchableOpacity
                    style={styles.deleteOrderBtn}
                    onPress={() => handleDeleteOrder(item.id)}
                  >
                    <Trash2 size={13} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardDetailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Qty</Text>
                  <Text style={styles.detailVal}>{item.quantity}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailVal}>
                    {!isNaN(priceNum) && priceNum > 0 ? `₹${priceNum.toFixed(2)}` : "MARKET"}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailVal}>{item.orderType}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailVal}>
                    {item.timestamp ? item.timestamp.split("T")[1]?.slice(0, 8) : "--"}
                  </Text>
                </View>
              </View>

              {item.errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>Error: {item.errorMessage}</Text>
                </View>
              )}

              {item.status === "PENDING" && (
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.modifyBtn}
                    onPress={() => handleOpenModify(item)}
                  >
                    <Edit3 size={13} color="#38bdf8" />
                    <Text style={styles.modifyText}>Modify Order</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelOrder(item.id)}
                  >
                    <Ban size={13} color="#f43f5e" />
                    <Text style={styles.cancelText}>Cancel Order</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Zap size={36} color="#334155" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyDesc}>Trade copy executions will be listed here in real-time.</Text>
          </View>
        }
      />

      {/* Modify Order Modal */}
      {modifyingOrder && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setModifyingOrder(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modify Order ({modifyingOrder.symbol})</Text>
                <TouchableOpacity onPress={() => setModifyingOrder(null)}>
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Order Type</Text>
              <View style={styles.modalChipRow}>
                {(["MARKET", "LIMIT", "SL"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.modalChip, modifyType === t && styles.activeModalChip]}
                    onPress={() => setModifyType(t)}
                  >
                    <Text style={[styles.modalChipText, modifyType === t && styles.activeModalChipText]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalRow}>
                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modifyQty}
                    onChangeText={setModifyQty}
                    keyboardType="numeric"
                  />
                </View>
                {modifyType !== "MARKET" && (
                  <View style={styles.flex1}>
                    <Text style={styles.inputLabel}>Price (₹)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={modifyPrice}
                      onChangeText={setModifyPrice}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.saveModifyBtn}
                onPress={handleConfirmModify}
                disabled={submittingModify}
              >
                <Save size={16} color="#090d16" />
                <Text style={styles.saveModifyText}>
                  {submittingModify ? "Updating Order..." : "Confirm Modify"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  headerControls: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  topControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: "#f8fafc",
    fontSize: 13,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: "#06b6d4",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#06b6d4",
  },
  clearAllBtn: {
    padding: 9,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderRadius: 8,
  },
  filterChipRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeFilterChip: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "#06b6d4",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeFilterText: {
    color: "#38bdf8",
    fontWeight: "800",
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  orderCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  symbolCol: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  sideTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sideTagText: {
    fontSize: 10,
    fontWeight: "900",
  },
  symbolText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
  },
  prodTag: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prodTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#38bdf8",
  },
  accountSubText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  headerRightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  deleteOrderBtn: {
    padding: 4,
  },
  cardDetailsGrid: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 10,
    justifyContent: "space-around",
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },
  detailVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 11,
    color: "#f43f5e",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  modifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modifyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f43f5e",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 8,
  },
  modalChipRow: {
    flexDirection: "row",
    gap: 8,
  },
  modalChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#1e293b",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeModalChip: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "#06b6d4",
  },
  modalChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeModalChipText: {
    color: "#38bdf8",
    fontWeight: "800",
  },
  modalRow: {
    flexDirection: "row",
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  modalInput: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#f8fafc",
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
  },
  saveModifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#06b6d4",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  saveModifyText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#090d16",
  },
});
