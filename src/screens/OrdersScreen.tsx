import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
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
  ListFilter,
  Zap,
} from "lucide-react-native";

export const OrdersScreen: React.FC = () => {
  const { orders, refreshOrders } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = filterStatus === "ALL" || ord.status === filterStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      ord.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCancelOrder = async (orderId: string) => {
    try {
      await ApiService.cancelOrder(orderId);
      await refreshOrders();
      Alert.alert("Order Cancelled", "Order cancellation request sent.");
    } catch (e: any) {
      Alert.alert("Cancel Failed", e?.message || "Could not cancel order.");
    }
  };

  const handleRetryOrder = async (orderId: string) => {
    try {
      await ApiService.retryOrder(orderId);
      await refreshOrders();
      Alert.alert("Retry Triggered", "Slave order re-execution requested.");
    } catch (e: any) {
      Alert.alert("Retry Failed", e?.message || "Could not retry order.");
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
        <View style={styles.searchBar}>
          <Search size={16} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search orders by symbol or account..."
            placeholderTextColor="#64748b"
          />
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
                  </View>
                  <Text style={styles.accountSubText}>
                    Account: {item.accountName} ({item.accountRole})
                  </Text>
                </View>

                {renderStatusBadge(item.status)}
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
                  <Text style={styles.detailVal}>{item.timestamp ? item.timestamp.split("T")[1]?.slice(0, 8) : "--"}</Text>
                </View>
              </View>

              {item.errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>Error: {item.errorMessage}</Text>
                </View>
              )}

              {(item.status === "PENDING" || item.status === "FAILED") && (
                <View style={styles.cardFooter}>
                  {item.status === "FAILED" && (
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={() => handleRetryOrder(item.id)}
                    >
                      <RotateCcw size={14} color="#38bdf8" />
                      <Text style={styles.retryText}>Retry Order</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === "PENDING" && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelOrder(item.id)}
                    >
                      <Ban size={14} color="#f43f5e" />
                      <Text style={styles.cancelText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#f8fafc",
    fontSize: 13,
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
    gap: 8,
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
  accountSubText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
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
    marginTop: 8,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "#38bdf8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
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
});
