import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useApp } from "../context/AppContext";
import {
  X,
  Power,
  Sun,
  Moon,
  Server,
  Zap,
  Key,
  Repeat,
  Lock,
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
  isLightTheme = false,
  onToggleTheme,
}) => {
  const {
    masterPowerActive,
    toggleMasterPower,
    settings,
    updateSettings,
    upstoxConnected,
    isConnected,
  } = useApp();

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
            <View style={[styles.drawer, isLightTheme && styles.drawerLight]}>
              {/* Header */}
              <View style={styles.drawerHeader}>
                <View style={styles.titleRow}>
                  <Zap size={20} color="#06b6d4" />
                  <Text style={[styles.drawerTitle, isLightTheme && styles.textLight]}>
                    System Controls
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.content}>
                {/* 1. Active / Pause Power Switch */}
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Power size={16} color={masterPowerActive ? "#10b981" : "#f43f5e"} />
                        <Text style={[styles.cardTitle, isLightTheme && styles.textLight]}>
                          Copier Engine Power
                        </Text>
                      </View>
                      <Text style={styles.cardSub}>
                        {masterPowerActive
                          ? "System ACTIVE • Replicating trades"
                          : "System PAUSED • Master trades ignored"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.powerBadgeBtn,
                        masterPowerActive ? styles.powerBadgeActive : styles.powerBadgeInactive,
                      ]}
                      onPress={() => toggleMasterPower(!masterPowerActive)}
                    >
                      <Text
                        style={[
                          styles.powerBadgeText,
                          { color: masterPowerActive ? "#10b981" : "#f43f5e" },
                        ]}
                      >
                        {masterPowerActive ? "ACTIVE" : "PAUSED"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Theme Toggle */}
                {onToggleTheme && (
                  <View style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={styles.cardLabelCol}>
                        <View style={styles.labelWithIcon}>
                          {isLightTheme ? (
                            <Sun size={16} color="#f59e0b" />
                          ) : (
                            <Moon size={16} color="#38bdf8" />
                          )}
                          <Text style={[styles.cardTitle, isLightTheme && styles.textLight]}>
                            App Appearance
                          </Text>
                        </View>
                        <Text style={styles.cardSub}>
                          Currently using {isLightTheme ? "Light Mode" : "Dark Mode"}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.themeToggleBtn} onPress={onToggleTheme}>
                        <Text style={styles.themeToggleText}>
                          {isLightTheme ? "Dark" : "Light"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 3. Server Connection / Settings */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => {
                    onClose();
                    onOpenServerConfig();
                  }}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Server size={16} color="#38bdf8" />
                        <Text style={[styles.cardTitle, isLightTheme && styles.textLight]}>
                          Backend Server Settings
                        </Text>
                      </View>
                      <Text style={styles.cardSub}>
                        {isConnected ? "Server Online • Port 3000" : "Server Disconnected"}
                      </Text>
                    </View>
                    <View style={styles.actionArrow}>
                      <Text style={styles.arrowText}>Connect →</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* 4. Auto Replicate Switch */}
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Repeat size={16} color="#06b6d4" />
                        <Text style={[styles.cardTitle, isLightTheme && styles.textLight]}>
                          Auto Replicate Orders
                        </Text>
                      </View>
                      <Text style={styles.cardSub}>
                        Copy master trades automatically to slave accounts
                      </Text>
                    </View>
                    <Switch
                      value={settings.autoReplicate}
                      onValueChange={(val) => updateSettings({ autoReplicate: val })}
                      trackColor={{ false: "#334155", true: "#0284c7" }}
                      thumbColor={settings.autoReplicate ? "#38bdf8" : "#94a3b8"}
                    />
                  </View>
                </View>

                {/* 5. Auto TOTP Login Switch */}
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Lock size={16} color="#f59e0b" />
                        <Text style={[styles.cardTitle, isLightTheme && styles.textLight]}>
                          Auto TOTP Auth
                        </Text>
                      </View>
                      <Text style={styles.cardSub}>
                        Renew Kotak session tokens automatically
                      </Text>
                    </View>
                    <Switch
                      value={settings.autoRenewSessions}
                      onValueChange={(val) => updateSettings({ autoRenewSessions: val })}
                      trackColor={{ false: "#334155", true: "#0284c7" }}
                      thumbColor={settings.autoRenewSessions ? "#38bdf8" : "#94a3b8"}
                    />
                  </View>
                </View>

                {/* 6. Upstox API Keys */}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => {
                    onClose();
                    onOpenUpstoxConfig();
                  }}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardLabelCol}>
                      <View style={styles.labelWithIcon}>
                        <Key size={16} color="#10b981" />
                        <Text style={[styles.cardTitle, isLightTheme && styles.textLight]}>
                          Upstox API Keys
                        </Text>
                      </View>
                      <Text style={styles.cardSub}>
                        {upstoxConnected ? "Upstox Stream Connected" : "Manage API Keys & Access Token"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: upstoxConnected
                            ? "rgba(16, 185, 129, 0.2)"
                            : "rgba(244, 63, 94, 0.2)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: upstoxConnected ? "#10b981" : "#f43f5e" },
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
    backgroundColor: "#0f172a",
    borderLeftWidth: 1,
    borderLeftColor: "#1e293b",
    paddingTop: 45,
    paddingHorizontal: 16,
  },
  drawerLight: {
    backgroundColor: "#f8fafc",
    borderLeftColor: "#e2e8f0",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
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
    color: "#f8fafc",
    letterSpacing: 0.5,
  },
  textLight: {
    color: "#0f172a",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#1e293b",
  },
  content: {
    gap: 10,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
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
    color: "#f8fafc",
  },
  cardSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },
  powerBadgeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  powerBadgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10b981",
  },
  powerBadgeInactive: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderColor: "#f43f5e",
  },
  powerBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  themeToggleBtn: {
    backgroundColor: "#0284c7",
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
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  arrowText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38bdf8",
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
