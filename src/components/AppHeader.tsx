import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Zap, Menu } from "lucide-react-native";
import { HamburgerMenuModal } from "./HamburgerMenuModal";

interface AppHeaderProps {
  onOpenServerConfig: () => void;
  onOpenUpstoxConfig?: () => void;
  isLightTheme?: boolean;
  onToggleTheme?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenServerConfig,
  onOpenUpstoxConfig = () => {},
  isLightTheme: propIsLight,
  onToggleTheme: propToggleTheme,
}) => {
  const { isConnected, isConnecting, totalPnl, quotes } = useApp();
  const { isLightTheme, toggleTheme, colors } = useTheme();

  const [menuVisible, setMenuVisible] = useState(false);

  const safePnl = typeof totalPnl === "number" && !isNaN(totalPnl) ? totalPnl : 0;
  const isPositive = safePnl >= 0;
  const formattedPnl = Math.abs(safePnl).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const activeIsLight = propIsLight ?? isLightTheme;
  const activeToggleTheme = propToggleTheme ?? toggleTheme;

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
        <Text style={[styles.indexName, { color: colors.textSecondary }]}>{name}</Text>
        {ltp !== undefined && ltp > 0 ? (
          <View style={styles.indexDetailsCol}>
            <Text style={[styles.indexLtp, { color: colors.textPrimary }]}>₹{ltp.toFixed(2)}</Text>
            <Text style={[styles.indexChange, { color: isUp ? colors.success : colors.danger }]}>
              {isUp ? `+${change.toFixed(2)}` : change.toFixed(2)} ({isUp ? `+${changePct.toFixed(2)}` : changePct.toFixed(2)}%)
            </Text>
          </View>
        ) : (
          <Text style={[styles.indexLoading, { color: colors.textMuted }]}>--.--</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Zap size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>NEO COPIER</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.danger }]} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {isConnecting ? "Connecting..." : isConnected ? "Server Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightActions}>
          <View
            style={[
              styles.pnlBadge,
              { backgroundColor: isPositive ? colors.successLight : colors.dangerLight },
            ]}
          >
            <Text style={[styles.pnlLabel, { color: isPositive ? colors.success : colors.danger }]}>MTM P&L</Text>
            <Text style={[styles.pnlValue, { color: isPositive ? colors.success : colors.danger }]}>
              {isPositive ? `+₹${formattedPnl}` : `-₹${formattedPnl}`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}
            onPress={() => setMenuVisible(true)}
          >
            <Menu size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Market Indices Ticker Bar */}
      <View style={[styles.indicesBarContainer, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}>
        {renderIndexChip("NIFTY 50", ["Nifty 50", "NIFTY", "NIFTY50", "26000"])}
        <View style={[styles.indexDivider, { backgroundColor: colors.cardBorder }]} />
        {renderIndexChip("SENSEX", ["SENSEX", "Sensex", "1"])}
      </View>

      {/* Hamburger Menu Drawer Modal */}
      <HamburgerMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onOpenServerConfig={onOpenServerConfig}
        onOpenUpstoxConfig={onOpenUpstoxConfig}
        isLightTheme={activeIsLight}
        onToggleTheme={activeToggleTheme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
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
    fontWeight: "600",
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
  menuButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  indicesBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  indexChip: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  indexName: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: "center",
  },
  indexDetailsCol: {
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
  },
  indexLtp: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  indexChange: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  indexLoading: {
    fontSize: 11,
    textAlign: "center",
  },
  indexDivider: {
    width: 1,
    height: 32,
    alignSelf: "center",
  },
});
