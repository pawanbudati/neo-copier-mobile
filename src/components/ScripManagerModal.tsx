import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ApiService } from "../services/api";
import { X, RefreshCw, Database, Trash2, Zap } from "lucide-react-native";

interface ScripManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ScripManagerModal: React.FC<ScripManagerModalProps> = ({ visible, onClose }) => {
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [scripStatus, setScripStatus] = useState<any>(null);
  const [fetchingStatus, setFetchingStatus] = useState(false);

  const fetchStatus = useCallback(async () => {
    setFetchingStatus(true);
    try {
      const data = await ApiService.getScripStatus();
      setScripStatus(data);
    } catch (e) {
      console.warn("Failed to fetch scrip status", e);
    } finally {
      setFetchingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchStatus();
    }
  }, [visible, fetchStatus]);

  const handleSyncDailyOptions = async () => {
    setLoadingCategory("daily");
    try {
      const res = await ApiService.loadDailyOptions();
      await fetchStatus();
      setLoadingCategory(null);
      Alert.alert(
        "Sync Complete",
        `Loaded ${res.niftyCount || 0} Nifty & ${res.sensexCount || 0} Sensex options (${res.totalCount || 0} total).`
      );
    } catch (e: any) {
      setLoadingCategory(null);
      Alert.alert("Sync Failed", e?.message || "Could not sync daily options.");
    }
  };

  const handleLoadCategory = async (categoryKey: string, categoryLabel: string) => {
    setLoadingCategory(categoryKey);
    try {
      const res = await ApiService.loadScripCategory(categoryKey);
      await fetchStatus();
      setLoadingCategory(null);
      Alert.alert("Loaded", `Loaded ${res.count || 0} scrips for ${categoryLabel}.`);
    } catch (e: any) {
      setLoadingCategory(null);
      Alert.alert("Load Failed", e?.message || `Could not load ${categoryLabel}.`);
    }
  };

  const handleWarmCache = async () => {
    setLoadingCategory("cache");
    try {
      const res = await ApiService.populateCache();
      await fetchStatus();
      setLoadingCategory(null);
      Alert.alert("Cache Warmed", `Loaded ${res.count || 0} scrips into memory.`);
    } catch (e: any) {
      setLoadingCategory(null);
      Alert.alert("Cache Failed", e?.message || "Failed to warm cache.");
    }
  };

  const handleClearScrips = async () => {
    Alert.alert("Clear All Scrips", "Are you sure you want to remove all scrips from DB?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          setLoadingCategory("clear");
          try {
            await ApiService.clearScrips();
            await fetchStatus();
            setLoadingCategory(null);
            Alert.alert("Cleared", "All scrips removed from database.");
          } catch (e: any) {
            setLoadingCategory(null);
            Alert.alert("Error", e?.message || "Failed to clear scrips.");
          }
        },
      },
    ]);
  };

  const categoryMap: Record<string, any> = {};
  if (scripStatus && Array.isArray(scripStatus.categories)) {
    scripStatus.categories.forEach((cat: any) => {
      categoryMap[cat.key] = cat;
    });
  }

  const categories = [
    { key: "nse_fo", label: "NSE Futures & Options" },
    { key: "bse_fo", label: "BSE Futures & Options" },
    { key: "nse_cm", label: "NSE Equity (Cash)" },
    { key: "bse_cm", label: "BSE Equity (Cash)" },
    { key: "mcx_fo", label: "MCX Commodities" },
    { key: "cde_fo", label: "CDS Currency Derivatives" },
  ];

  const totalCount = scripStatus?.totalCount ?? 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Database size={20} color="#06b6d4" />
              <Text style={styles.headerTitle}>Scrip Master Manager</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Live Cache Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardHeader}>
                <View>
                  <Text style={styles.statusLabel}>Active Memory Cache Status</Text>
                  <Text style={styles.statusVal}>{totalCount.toLocaleString()} Scrips Loaded</Text>
                </View>
                <TouchableOpacity style={styles.refreshIconBtn} onPress={fetchStatus} disabled={fetchingStatus}>
                  <RefreshCw size={14} color="#06b6d4" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.warmCacheBtn}
                onPress={handleWarmCache}
                disabled={loadingCategory !== null}
              >
                {loadingCategory === "cache" ? (
                  <ActivityIndicator size="small" color="#38bdf8" />
                ) : (
                  <>
                    <RefreshCw size={12} color="#38bdf8" />
                    <Text style={styles.warmCacheText}>Re-index / Warm Memory Cache</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Sync Daily Options */}
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleSyncDailyOptions}
              disabled={loadingCategory !== null}
            >
              {loadingCategory === "daily" ? (
                <ActivityIndicator color="#090d16" />
              ) : (
                <>
                  <Zap size={18} color="#090d16" />
                  <View style={styles.btnCol}>
                    <Text style={styles.syncBtnText}>Sync Daily Options (Nifty & Sensex)</Text>
                    <Text style={styles.syncSubText}>Filters out expired contracts automatically</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>Full Category Load</Text>

            {categories.map((cat) => {
              const info = categoryMap[cat.key];
              const count = info?.count ?? 0;
              const isLoaded = info?.isLoaded ?? count > 0;

              return (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.categoryRow}
                  onPress={() => handleLoadCategory(cat.key, cat.label)}
                  disabled={loadingCategory !== null}
                >
                  <View style={styles.catLeft}>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    {isLoaded ? (
                      <Text style={styles.catLoadedText}>✓ Loaded ({count.toLocaleString()} scrips)</Text>
                    ) : (
                      <Text style={styles.catNotLoadedText}>Not Loaded</Text>
                    )}
                  </View>

                  {loadingCategory === cat.key ? (
                    <ActivityIndicator size="small" color="#06b6d4" />
                  ) : (
                    <View style={[styles.loadBadge, isLoaded && styles.loadBadgeActive]}>
                      <RefreshCw size={12} color={isLoaded ? "#10b981" : "#06b6d4"} />
                      <Text style={[styles.loadBadgeText, isLoaded && styles.loadBadgeTextActive]}>
                        {isLoaded ? "Reload" : "Load"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearScrips}
              disabled={loadingCategory !== null}
            >
              <Trash2 size={16} color="#f43f5e" />
              <Text style={styles.clearBtnText}>Clear All Scrips from Database</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10b981",
    marginTop: 2,
  },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderRadius: 8,
  },
  warmCacheBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderRadius: 8,
  },
  warmCacheText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#06b6d4",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  btnCol: {
    flex: 1,
  },
  syncBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#090d16",
  },
  syncSubText: {
    fontSize: 11,
    color: "rgba(9, 13, 22, 0.75)",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  catLeft: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
  },
  catLoadedText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "600",
    marginTop: 2,
  },
  catNotLoadedText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  loadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
  },
  loadBadgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  loadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#06b6d4",
  },
  loadBadgeTextActive: {
    color: "#10b981",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    marginTop: 12,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f43f5e",
  },
});
