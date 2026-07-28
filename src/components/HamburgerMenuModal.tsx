import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
} from "react-native";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import {
  Zap,
  Power,
  Server,
  Repeat,
  Lock,
  Sun,
  Moon,
  X,
  Key,
} from "lucide-react-native";

interface HamburgerMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenServerConfig: () => void;
  onOpenUpstoxConfig: () => void;
  isLightTheme?: boolean;
  onToggleTheme?: () => void;
}

export const HamburgerMenuModal: React.FC<HamburgerMenuModalProps> = ({
  visible,
  onClose,
  onOpenServerConfig,
  onOpenUpstoxConfig,
  onToggleTheme: propToggleTheme,
}) => {
  const {
    masterPowerActive,
    toggleMasterPower,
    serverUrl,
    isConnected,
    settings,
    updateSettings,
    upstoxConnected,
  } = useApp();

  const { isLightTheme, toggleTheme, colors } = useTheme();
  const activeToggleTheme = propToggleTheme ?? toggleTheme;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.drawer, { backgroundColor: colors.cardBg, borderLeftColor: colors.cardBorder }]}>
              {/* Header */}
              <View style={[styles.drawerHeader, { borderBottomColor: colors.cardBorder }]}>
                <View style={styles.titleRow}>
                  <Zap size={20} color={colors.primary} />
                  <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
                    System Controls
                  </Text>
                </View>
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardBgSecondary }]} onPress={onClose}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* 1. Active / Pause Power Switch */}
                <View style={[styles.card, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Power size={16} color={masterPowerActive ? colors.success : colors.danger} />
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          Copier Engine Power
                        </Text>
                      </View>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        {masterPowerActive
                          ? "System ACTIVE • Replicating trades"
                          : "System PAUSED • Master trades ignored"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.powerBadgeBtn,
                        {
                          backgroundColor: masterPowerActive ? colors.successLight : colors.dangerLight,
                          borderColor: masterPowerActive ? colors.success : colors.danger,
                        },
                      ]}
                      onPress={() => toggleMasterPower(!masterPowerActive)}
                    >
                      <Text
                        style={[
                          styles.powerBadgeText,
                          { color: masterPowerActive ? colors.success : colors.danger },
                        ]}
                      >
                        {masterPowerActive ? "ACTIVE" : "PAUSED"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Theme Toggle */}
                <View style={[styles.card, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        {isLightTheme ? (
                          <Sun size={16} color={colors.warning} />
                        ) : (
                          <Moon size={16} color={colors.primary} />
                        )}
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          App Appearance
                        </Text>
                      </View>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        Currently using {isLightTheme ? "Light Mode" : "Dark Mode"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.themeToggleBtn, { backgroundColor: colors.primary }]}
                      onPress={activeToggleTheme}
                    >
                      <Text style={styles.themeToggleText}>
                        {isLightTheme ? "Dark" : "Light"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Server Connection / Settings */}
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}
                  onPress={() => {
                    onClose();
                    onOpenServerConfig();
                  }}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Server size={16} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          Backend Server Settings
                        </Text>
                      </View>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {serverUrl || "https://neo-copier.duckdns.org"} • {isConnected ? "Online" : "Offline"}
                      </Text>
                    </View>
                    <View style={[styles.actionArrow, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.arrowText, { color: colors.primary }]}>Connect →</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* 4. Auto Replicate Switch */}
                <View style={[styles.card, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Repeat size={16} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          Auto Replicate Orders
                        </Text>
                      </View>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        Copy master trades automatically to slave accounts
                      </Text>
                    </View>
                    <Switch
                      value={settings.autoReplicate}
                      onValueChange={(val) => updateSettings({ autoReplicate: val })}
                      trackColor={{ false: colors.cardBorder, true: colors.primary }}
                      thumbColor={settings.autoReplicate ? "#ffffff" : colors.textMuted}
                    />
                  </View>
                </View>

                {/* 5. Auto TOTP Login Switch */}
                <View style={[styles.card, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Lock size={16} color={colors.warning} />
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          Auto TOTP Auth
                        </Text>
                      </View>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        Renew Kotak session tokens automatically
                      </Text>
                    </View>
                    <Switch
                      value={settings.autoRenewSessions}
                      onValueChange={(val) => updateSettings({ autoRenewSessions: val })}
                      trackColor={{ false: colors.cardBorder, true: colors.primary }}
                      thumbColor={settings.autoRenewSessions ? "#ffffff" : colors.textMuted}
                    />
                  </View>
                </View>

                {/* 6. Upstox API Keys */}
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}
                  onPress={() => {
                    onClose();
                    onOpenUpstoxConfig();
                  }}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Key size={16} color={colors.success} />
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          Upstox API Keys
                        </Text>
                      </View>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        {upstoxConnected ? "Upstox Stream Connected" : "Manage API Keys & Access Token"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: upstoxConnected ? colors.successLight : colors.dangerLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: upstoxConnected ? colors.success : colors.danger },
                        ]}
                      >
                        {upstoxConnected ? "Connected" : "Setup"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  drawer: {
    width: "85%",
    height: "100%",
    borderLeftWidth: 1,
    paddingTop: 45,
    paddingHorizontal: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
  },
  content: {
    gap: 10,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabelCol: {
    flex: 1,
    marginRight: 10,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  cardSub: {
    fontSize: 11,
    marginTop: 4,
  },
  powerBadgeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  powerBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  themeToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  themeToggleText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  actionArrow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  arrowText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
