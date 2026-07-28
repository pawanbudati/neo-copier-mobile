import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
} from "react-native";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { ApiService } from "../services/api";
import { AccountModal } from "../components/AccountModal";
import { UpstoxModal } from "../components/UpstoxModal";
import { AccountSummary } from "../types";
import {
  UserPlus,
  ShieldCheck,
  Key,
  Trash2,
  Edit2,
  RefreshCw,
  Layers,
  Zap,
} from "lucide-react-native";

export const AccountsScreen: React.FC = () => {
  const {
    accounts,
    refreshAccounts,
    margins,
    refreshMargins,
    upstoxConnected,
    upstoxAuthUrl,
    refreshUpstoxStatus,
    settings,
    updateSettings,
  } = useApp();

  const { isLightTheme, colors } = useTheme();

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountSummary | null>(null);
  const [upstoxModalVisible, setUpstoxModalVisible] = useState(false);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);

  const masterCount = accounts.filter((a) => a.role === "master").length;
  const slaveCount = accounts.filter((a) => a.role === "slave").length;

  const totalMarginSum = margins.reduce((acc, m) => acc + (Number(m.totalMargin || m.cash) || 0), 0);
  const availMarginSum = margins.reduce((acc, m) => acc + (Number(m.availableMargin) || 0), 0);
  const usedMarginSum = margins.reduce((acc, m) => acc + (Number(m.usedMargin || m.marginUsed) || 0), 0);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setAccountModalVisible(true);
  };

  const handleOpenEdit = (acc: AccountSummary) => {
    setEditingAccount(acc);
    setAccountModalVisible(true);
  };

  const handleDelete = (acc: AccountSummary) => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to remove account "${acc.nickname}" (${acc.ucc})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.deleteAccount(acc.id);
              await refreshAccounts();
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  const handleTriggerLogin = async (acc: AccountSummary) => {
    setLoggingInId(acc.id);
    try {
      await ApiService.loginAccount(acc.id);
      await refreshAccounts();
      Alert.alert("TOTP Auth Triggered", `Auto TOTP login executed for ${acc.nickname}.`);
    } catch (e: any) {
      Alert.alert("Login Failed", e?.message || "Could not complete TOTP login.");
    } finally {
      setLoggingInId(null);
    }
  };

  const handleTotpPreview = async (acc: AccountSummary) => {
    try {
      const res = await ApiService.getTotpPreview(acc.id);
      if (res && res.code) {
        Alert.alert("Live TOTP Code", `Current 6-digit TOTP Code for ${acc.nickname}:\n\n${res.code}`);
      } else {
        Alert.alert("TOTP Preview", res.error || "Could not generate TOTP code.");
      }
    } catch (e: any) {
      Alert.alert("TOTP Error", e?.message || "TOTP secret not found.");
    }
  };

  const handleLoginAll = async () => {
    try {
      await ApiService.loginAllAccounts();
      await refreshAccounts();
      Alert.alert("Auto Auth", "TOTP login triggered for all accounts.");
    } catch (e: any) {
      Alert.alert("Login Failed", e?.message || "Could not authenticate accounts.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statVal, { color: colors.textPrimary }]}>{accounts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Accounts</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statVal, { color: colors.warning }]}>{masterCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Master</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.statVal, { color: colors.primary }]}>{slaveCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Slaves</Text>
        </View>
      </View>

      {/* Margins Summary Header */}
      {margins.length > 0 && (
        <View style={[styles.marginsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.marginCol}>
            <Text style={[styles.marginSubLabel, { color: colors.textSecondary }]}>Total Cash</Text>
            <Text style={[styles.marginVal, { color: colors.textPrimary }]}>₹{totalMarginSum.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={[styles.marginDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.marginCol}>
            <Text style={[styles.marginSubLabel, { color: colors.textSecondary }]}>Available</Text>
            <Text style={[styles.marginVal, { color: colors.success }]}>
              ₹{availMarginSum.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={[styles.marginDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.marginCol}>
            <Text style={[styles.marginSubLabel, { color: colors.textSecondary }]}>Used Margin</Text>
            <Text style={[styles.marginVal, { color: colors.warning }]}>
              ₹{usedMarginSum.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      )}

      {/* Account Header & Action */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Kotak Accounts</Text>
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity style={[styles.loginAllBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} onPress={handleLoginAll}>
            <Zap size={14} color={colors.primary} />
            <Text style={[styles.loginAllText, { color: colors.primary }]}>Login All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addAccountBtn, { backgroundColor: colors.primary }]} onPress={handleOpenAdd}>
            <UserPlus size={14} color="#ffffff" />
            <Text style={[styles.addAccountText, { color: "#ffffff" }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Accounts List */}
      <FlatList
        data={accounts}
        keyExtractor={(item, idx) => String(item.id || item.ucc || idx)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isMaster = item.role === "master";
          const isActive = item.status === "active";

          return (
            <View style={[styles.accountCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTitleCol}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.accountNickname, { color: colors.textPrimary }]}>{item.nickname}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: isMaster ? colors.warningLight : colors.primaryLight },
                      ]}
                    >
                      <Text style={[styles.roleBadgeText, { color: isMaster ? colors.warning : colors.primary }]}>
                        {item.role.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.accountUcc, { color: colors.textSecondary }]}>UCC: {item.ucc} • Mobile: {item.mobileNumber}</Text>
                </View>

                <View style={styles.cardStatusCol}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)" },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: isActive ? "#10b981" : "#f43f5e" }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  {!isMaster && (
                    <Text style={styles.multiplierText}>Multiplier: {item.multiplier}x</Text>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardBottomRow}>
                <TouchableOpacity
                  style={styles.totpBtn}
                  onPress={() => handleTriggerLogin(item)}
                  disabled={loggingInId === item.id}
                >
                  <Key size={14} color="#38bdf8" />
                  <Text style={styles.totpBtnText}>
                    {loggingInId === item.id ? "Authenticating..." : "Login (TOTP)"}
                  </Text>
                </TouchableOpacity>

                {item.hasAutoTotpSecret && (
                  <TouchableOpacity
                    style={styles.totpPreviewBtn}
                    onPress={() => handleTotpPreview(item)}
                  >
                    <ShieldCheck size={14} color="#10b981" />
                    <Text style={styles.totpPreviewText}>Code</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
                  <Edit2 size={14} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Trash2 size={14} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Zap size={36} color="#334155" />
            <Text style={styles.emptyTitle}>No Accounts Configured</Text>
            <Text style={styles.emptyDesc}>Tap 'Add Account' to set up Master & Slave trading accounts.</Text>
          </View>
        }
      />

      {/* Account Creation Modal */}
      <AccountModal
        visible={accountModalVisible}
        editingAccount={editingAccount}
        onClose={() => setAccountModalVisible(false)}
        onSuccess={refreshAccounts}
      />

      {/* Upstox Modal */}
      <UpstoxModal visible={upstoxModalVisible} onClose={() => setUpstoxModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f8fafc",
  },
  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
  marginsCard: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  marginCol: {
    alignItems: "center",
    flex: 1,
  },
  marginSubLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  marginVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f8fafc",
    marginTop: 2,
  },
  marginDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#1e293b",
  },
  totpPreviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  totpPreviewText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10b981",
  },
  compactControlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  compactToggleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compactToggleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#1e293b",
  },
  compactUpstoxBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  compactUpstoxText: {
    fontSize: 11,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
  },
  addAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#06b6d4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerBtnGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "#38bdf8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#38bdf8",
  },
  addAccountText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#090d16",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 10,
  },
  accountCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitleCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountNickname: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  accountUcc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  cardStatusCol: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  multiplierText: {
    fontSize: 11,
    color: "#38bdf8",
    fontWeight: "700",
    marginTop: 4,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  totpBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingVertical: 8,
    borderRadius: 6,
  },
  totpBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
  },
  editBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#1e293b",
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#1e293b",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
    textAlign: "center",
  },
});
