import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from "react-native";
import { useApp } from "../context/AppContext";
import { Server, Zap, Sun, Moon, Power } from "lucide-react-native";

interface AppHeaderProps {
  onOpenServerConfig: () => void;
  isLightTheme?: boolean;
  onToggleTheme?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenServerConfig,
  isLightTheme = false,
  onToggleTheme,
}) => {
  const {
    isConnected,
    isConnecting,
    totalPnl,
    settings,
    updateSettings,
    quotes,
    masterPowerActive,
    toggleMasterPower,
  } = useApp();

  const safePnl = typeof totalPnl === "number" && !isNaN(totalPnl) ? totalPnl : 0;
  const isPositive = safePnl >= 0;
  const formattedPnl = Math.abs(safePnl).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const renderIndexChip = (name: string, keys: string[]) => {
    let q: any = null;
    for (const k of keys) {
      if (quotes[k]) {
        q = quotes[k];
        break;
      }
    }
    const ltp = q?.ltp;
    const change = q?.change ?? 0;
    const changePct = q?.changePct ?? 0;
    const isUp = change >= 0;

    return (
      <View style={styles.indexChip}>
        <Text style={styles.indexName}>{name}</Text>
        {ltp !== undefined && ltp > 0 ? (
          <View style={styles.indexPriceRow}>
            <Text style={styles.indexLtp}>₹{ltp.toFixed(2)}</Text>
            <Text style={[styles.indexChange, { color: isUp ? "#10b981" : "#f43f5e" }]}>
              {isUp ? `+${change.toFixed(2)}` : change.toFixed(2)} ({isUp ? `+${changePct.toFixed(2)}` : changePct.toFixed(2)}%)
            </Text>
          </View>
        ) : (
          <Text style={styles.indexLoading}>--.--</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isLightTheme && styles.containerLight]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Zap size={18} color="#06b6d4" />
          </View>
          <View>
            <Text style={[styles.brandTitle, isLightTheme && styles.textLightPrimary]}>NEO COPIER</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? "#10b981" : "#ef4444" }]} />
              <Text style={styles.statusText}>
                {isConnecting ? "Connecting..." : isConnected ? "Server Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[
              styles.powerButton,
              masterPowerActive ? styles.powerButtonActive : styles.powerButtonInactive,
            ]}
            onPress={() => toggleMasterPower(!masterPowerActive)}
          >
            <Power size={16} color={masterPowerActive ? "#10b981" : "#f43f5e"} />
            <Text style={[styles.powerText, { color: masterPowerActive ? "#10b981" : "#f43f5e" }]}>
              {masterPowerActive ? "ACTIVE" : "PAUSED"}
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.pnlBadge,
              { backgroundColor: isPositive ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)" },
            ]}
          >
            <Text style={[styles.pnlLabel, { color: isPositive ? "#10b981" : "#f43f5e" }]}>MTM P&L</Text>
            <Text style={[styles.pnlValue, { color: isPositive ? "#10b981" : "#f43f5e" }]}>
              {isPositive ? `+₹${formattedPnl}` : `-₹${formattedPnl}`}
            </Text>
          </View>

          {onToggleTheme && (
            <TouchableOpacity style={styles.iconButton} onPress={onToggleTheme}>
              {isLightTheme ? <Moon size={18} color="#0284c7" /> : <Sun size={18} color="#f59e0b" />}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconButton} onPress={onOpenServerConfig}>
            <Server size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Market Indices Ticker Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.indicesBar}
      >
        {renderIndexChip("NIFTY 50", ["Nifty 50", "NIFTY", "NIFTY50", "26000"])}
        <View style={styles.indexDivider} />
        {renderIndexChip("SENSEX", ["SENSEX", "Sensex", "1"])}
      </ScrollView>

      {/* Control Switches Bar */}
      <View style={styles.controlBar}>
        <View style={styles.toggleItem}>
          <Text style={[styles.toggleLabel, isLightTheme && styles.textLightSubtle]}>Auto Replicate</Text>
          <Switch
            value={settings.autoReplicate}
            onValueChange={(val) => updateSettings({ autoReplicate: val })}
            trackColor={{ false: "#334155", true: "#0284c7" }}
            thumbColor={settings.autoReplicate ? "#38bdf8" : "#94a3b8"}
          />
        </View>

        <View style={styles.toggleDivider} />

        <View style={styles.toggleItem}>
          <Text style={[styles.toggleLabel, isLightTheme && styles.textLightSubtle]}>Auto TOTP</Text>
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  containerLight: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#e2e8f0",
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
  textLightPrimary: {
    color: "#0f172a",
  },
  textLightSubtle: {
    color: "#475569",
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
  powerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  powerButtonActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  powerButtonInactive: {
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  powerText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
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
  indicesBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 8,
  },
  indexChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  indexName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  indexPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  indexLtp: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f8fafc",
  },
  indexChange: {
    fontSize: 10,
    fontWeight: "700",
  },
  indexLoading: {
    fontSize: 10,
    color: "#64748b",
  },
  indexDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#334155",
  },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 8,
    paddingTop: 6,
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
