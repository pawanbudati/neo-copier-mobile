import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useApp } from "../context/AppContext";
import { Server, Zap, RefreshCw } from "lucide-react-native";

interface AppHeaderProps {
  onOpenServerConfig: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenServerConfig }) => {
  const { isConnected, isConnecting, totalPnl, settings, updateSettings } = useApp();

  const formattedPnl = totalPnl.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Zap size={18} color="#06b6d4" />
          </View>
          <View>
            <Text style={styles.brandTitle}>NEO COPIER</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? "#10b981" : "#ef4444" }]} />
              <Text style={styles.statusText}>
                {isConnecting ? "Connecting..." : isConnected ? "Server Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightActions}>
          <View
            style={[
              styles.pnlBadge,
              { backgroundColor: totalPnl >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)" },
            ]}
          >
            <Text style={[styles.pnlLabel, { color: totalPnl >= 0 ? "#10b981" : "#f43f5e" }]}>MTM P&L</Text>
            <Text style={[styles.pnlValue, { color: totalPnl >= 0 ? "#10b981" : "#f43f5e" }]}>
              {totalPnl >= 0 ? `+₹${formattedPnl}` : `-₹${Math.abs(totalPnl).toFixed(2)}`}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={onOpenServerConfig}>
            <Server size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlBar}>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>Auto Replicate</Text>
          <Switch
            value={settings.autoReplicate}
            onValueChange={(val) => updateSettings({ autoReplicate: val })}
            trackColor={{ false: "#334155", true: "#0284c7" }}
            thumbColor={settings.autoReplicate ? "#38bdf8" : "#94a3b8"}
          />
        </View>

        <View style={styles.toggleDivider} />

        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>Auto TOTP</Text>
          <Switch
            value={settings.autoRenewSessions}
            onValueChange={(val) => updateSettings({ autoRenewSessions: val })}
            trackColor={{ false: "#334155", true: "#0284c7" }}
            thumbColor={settings.autoRenewSessions ? "#38bdf8" : "#94a3b8"}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pnlBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "flex-end",
  },
  pnlLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  pnlValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1e293b",
  },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  toggleDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#334155",
  },
});
