import React, { useState } from "react";
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

  const handleSyncDailyOptions = async () => {
    setLoadingCategory("daily");
    try {
      const res = await ApiService.loadDailyOptions();
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
      setLoadingCategory(null);
      Alert.alert("Loaded", `Loaded ${res.count || 0} scrips for ${categoryLabel}.`);
    } catch (e: any) {
      setLoadingCategory(null);
      Alert.alert("Load Failed", e?.message || `Could not load ${categoryLabel}.`);
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

  const categories = [
    { key: "nse_fo", label: "NSE Futures & Options" },
    { key: "bse_fo", label: "BSE Futures & Options" },
    { key: "nse_cm", label: "NSE Equity (Cash)" },
    { key: "bse_cm", label: "BSE Equity (Cash)" },
    { key: "mcx_fo", label: "MCX Commodities" },
    { key: "cde_fo", label: "CDS Currency Derivatives" },
  ];

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

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={styles.categoryRow}
                onPress={() => handleLoadCategory(cat.key, cat.label)}
                disabled={loadingCategory !== null}
              >
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                {loadingCategory === cat.key ? (
                  <ActivityIndicator size="small" color="#06b6d4" />
                ) : (
                  <View style={styles.loadBadge}>
                    <RefreshCw size={12} color="#06b6d4" />
                    <Text style={styles.loadBadgeText}>Load</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

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
    maxHeight: "80%",
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
    fontWeight: "900",
    color: "#090d16",
  },
  syncSubText: {
    fontSize: 11,
    color: "#0f172a",
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "uppercase",
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
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f8fafc",
  },
  loadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  loadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#06b6d4",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "#f43f5e",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f43f5e",
  },
});
