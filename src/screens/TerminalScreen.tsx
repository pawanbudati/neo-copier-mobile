import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useApp } from "../context/AppContext";
import { ApiService } from "../services/api";
import { OrderPlacementModal } from "../components/OrderPlacementModal";
import { ScripInfo, Position } from "../types";
import {
  Search,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Zap,
  RotateCcw,
} from "lucide-react-native";

interface TerminalScreenProps {
  navigation: any;
}

export const TerminalScreen: React.FC<TerminalScreenProps> = ({ navigation }) => {
  const {
    watchlist,
    positions,
    quotes,
    addToWatchlist,
    removeFromWatchlist,
    refreshPositions,
    totalPnl,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"watchlist" | "positions" | "search">("watchlist");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ScripInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Order modal state
  const [selectedScripForOrder, setSelectedScripForOrder] = useState<ScripInfo | null>(null);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await ApiService.searchScrips(query.trim());
      if (Array.isArray(results)) setSearchResults(results);
    } catch (e) {
      console.warn("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenOrder = (scrip: any, side: "BUY" | "SELL") => {
    setSelectedScripForOrder(scrip);
    setOrderSide(side);
    setOrderModalVisible(true);
  };

  const handleOpenChart = (scrip: any) => {
    navigation.navigate("LiveChart", { scrip });
  };

  const handleSquareOffSingle = async (pos: Position) => {
    Alert.alert(
      "Square Off Position",
      `Are you sure you want to square off ${pos.symbol}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Square Off",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.squareOffPosition(pos.symbol);
              await refreshPositions();
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to square off position.");
            }
          },
        },
      ]
    );
  };

  const handleSquareOffAll = async () => {
    Alert.alert(
      "EMERGENCY SQUARE OFF ALL",
      "Are you sure you want to square off ALL open positions across all accounts?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SQUARE OFF ALL",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.squareOffAllPositions();
              await refreshPositions();
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to square off positions.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "watchlist" && styles.activeTabItem]}
          onPress={() => setActiveTab("watchlist")}
        >
          <Text style={[styles.tabText, activeTab === "watchlist" && styles.activeTabText]}>
            Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "positions" && styles.activeTabItem]}
          onPress={() => setActiveTab("positions")}
        >
          <Text style={[styles.tabText, activeTab === "positions" && styles.activeTabText]}>
            Positions ({positions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "search" && styles.activeTabItem]}
          onPress={() => setActiveTab("search")}
        >
          <Search size={14} color={activeTab === "search" ? "#06b6d4" : "#94a3b8"} />
          <Text style={[styles.tabText, activeTab === "search" && styles.activeTabText]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* WATCHLIST TAB */}
      {activeTab === "watchlist" && (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.scriptToken || item.tradingSymbol}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const quote = quotes[item.scriptToken];
            const ltp = quote?.ltp ?? 0;
            const change = quote?.change ?? 0;
            const changePct = quote?.changePct ?? 0;
            const isUp = change >= 0;

            return (
              <View style={styles.scripCard}>
                <View style={styles.scripHeader}>
                  <View style={styles.scripTitleCol}>
                    <Text style={styles.scripSymbol}>
                      {item.scripRefKey || item.tradingSymbol}
                    </Text>
                    <Text style={styles.scripSubtitle}>
                      {item.exchange} • {item.segment}
                    </Text>
                  </View>

                  <View style={styles.scripPriceCol}>
                    <Text style={styles.scripLtp}>
                      ₹{ltp > 0 ? ltp.toFixed(2) : "--.--"}
                    </Text>
                    <Text style={[styles.scripChange, { color: isUp ? "#10b981" : "#f43f5e" }]}>
                      {isUp ? `+${change.toFixed(2)} (${changePct.toFixed(2)}%)` : `${change.toFixed(2)} (${changePct.toFixed(2)}%)`}
                    </Text>
                  </View>
                </View>

                {/* Quick Action buttons */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => handleOpenOrder(item, "BUY")}
                  >
                    <Text style={styles.buyBtnText}>BUY</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sellBtn}
                    onPress={() => handleOpenOrder(item, "SELL")}
                  >
                    <Text style={styles.sellBtnText}>SELL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chartBtn}
                    onPress={() => handleOpenChart(item)}
                  >
                    <BarChart2 size={16} color="#38bdf8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeFromWatchlist(item.scriptToken)}
                  >
                    <Trash2 size={16} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Zap size={36} color="#334155" />
              <Text style={styles.emptyTitle}>Watchlist is empty</Text>
              <Text style={styles.emptyDesc}>Use the search tab to find scrips and add them here.</Text>
            </View>
          }
        />
      )}

      {/* POSITIONS TAB */}
      {activeTab === "positions" && (
        <View style={styles.flex1}>
          <View style={styles.positionsSummaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>Total Net MTM</Text>
              <Text style={[styles.summaryVal, { color: totalPnl >= 0 ? "#10b981" : "#f43f5e" }]}>
                {totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`}
              </Text>
            </View>

            {positions.length > 0 && (
              <TouchableOpacity style={styles.squareOffAllBtn} onPress={handleSquareOffAll}>
                <RotateCcw size={14} color="#f8fafc" />
                <Text style={styles.squareOffAllText}>Square Off All</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={positions}
            keyExtractor={(item, idx) => item.symbol + idx}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const liveLtp = quotes[item.symbol]?.ltp || item.actvLtp || item.ltp || 0;
              const unrealized = item.netQty !== 0 ? (liveLtp - item.buyAvg) * item.netQty : 0;
              const itemTotalPnl = (item.realizedPnl || 0) + unrealized;
              const isProfit = itemTotalPnl >= 0;

              return (
                <View style={styles.scripCard}>
                  <View style={styles.scripHeader}>
                    <View style={styles.scripTitleCol}>
                      <Text style={styles.scripSymbol}>{item.symbol}</Text>
                      <Text style={styles.scripSubtitle}>
                        Qty: {item.netQty} • Avg: ₹{item.buyAvg.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.scripPriceCol}>
                      <Text style={styles.scripLtp}>₹{liveLtp.toFixed(2)}</Text>
                      <Text style={[styles.scripChange, { color: isProfit ? "#10b981" : "#f43f5e" }]}>
                        {isProfit ? `+₹${itemTotalPnl.toFixed(2)}` : `-₹${Math.abs(itemTotalPnl).toFixed(2)}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.chartBtnFlex}
                      onPress={() => handleOpenChart({ tradingSymbol: item.symbol })}
                    >
                      <BarChart2 size={16} color="#38bdf8" />
                      <Text style={styles.chartBtnText}>Chart</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.squareOffSingleBtn}
                      onPress={() => handleSquareOffSingle(item)}
                    >
                      <Text style={styles.squareOffSingleText}>Square Off</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Zap size={36} color="#334155" />
                <Text style={styles.emptyTitle}>No Open Positions</Text>
                <Text style={styles.emptyDesc}>Executed trades across master/slaves will appear here.</Text>
              </View>
            }
          />
        </View>
      )}

      {/* SEARCH TAB */}
      {activeTab === "search" && (
        <View style={styles.flex1}>
          <View style={styles.searchBarContainer}>
            <Search size={18} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search NIFTY, BANKNIFTY, CE, PE, Stocks..."
              placeholderTextColor="#64748b"
              autoFocus
            />
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.scriptToken || item.tradingSymbol}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.scripCard}>
                <View style={styles.scripHeader}>
                  <View style={styles.scripTitleCol}>
                    <Text style={styles.scripSymbol}>
                      {item.scripRefKey || item.tradingSymbol}
                    </Text>
                    <Text style={styles.scripSubtitle}>
                      {item.exchange} • {item.segment} • Lot: {item.lotSize}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.addWatchlistBtn}
                    onPress={() => {
                      addToWatchlist(item);
                      Alert.alert("Added", `${item.tradingSymbol} added to watchlist.`);
                    }}
                  >
                    <Plus size={16} color="#06b6d4" />
                    <Text style={styles.addWatchlistText}>Add Watchlist</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => handleOpenOrder(item, "BUY")}
                  >
                    <Text style={styles.buyBtnText}>BUY</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sellBtn}
                    onPress={() => handleOpenOrder(item, "SELL")}
                  >
                    <Text style={styles.sellBtnText}>SELL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Order Placement Modal */}
      <OrderPlacementModal
        visible={orderModalVisible}
        initialScrip={selectedScripForOrder}
        initialSide={orderSide}
        onClose={() => setOrderModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  flex1: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabItem: {
    borderBottomColor: "#06b6d4",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeTabText: {
    color: "#06b6d4",
    fontWeight: "800",
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  scripCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
  },
  scripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  scripTitleCol: {
    flex: 1,
  },
  scripSymbol: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  scripSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  scripPriceCol: {
    alignItems: "flex-end",
  },
  scripLtp: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  scripChange: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  buyBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buyBtnText: {
    color: "#090d16",
    fontWeight: "800",
    fontSize: 12,
  },
  sellBtn: {
    backgroundColor: "#f43f5e",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sellBtnText: {
    color: "#090d16",
    fontWeight: "800",
    fontSize: 12,
  },
  chartBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#1e293b",
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#1e293b",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  positionsSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  squareOffAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f43f5e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  squareOffAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f8fafc",
  },
  chartBtnFlex: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1e293b",
    paddingVertical: 6,
    borderRadius: 6,
  },
  chartBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#38bdf8",
  },
  squareOffSingleBtn: {
    backgroundColor: "rgba(244, 63, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#f43f5e",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  squareOffSingleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f43f5e",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    margin: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: "#f8fafc",
    fontSize: 14,
  },
  addWatchlistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: "auto",
  },
  addWatchlistText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#06b6d4",
  },
});
