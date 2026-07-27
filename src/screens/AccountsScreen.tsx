import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useApp } from "../context/AppContext";
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
    upstoxConnected,
    upstoxAuthUrl,
    refreshUpstoxStatus,
  } = useApp();

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountSummary | null>(null);
  const [upstoxModalVisible, setUpstoxModalVisible] = useState(false);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);

  const masterCount = accounts.filter((a) => a.role === "master").length;
  const slaveCount = accounts.filter((a) => a.role === "slave").length;

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
    <View style={styles.container}>
      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{accounts.length}</Text>
          <Text style={styles.statLabel}>Total Accounts</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: "#f59e0b" }]}>{masterCount}</Text>
          <Text style={styles.statLabel}>Master</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: "#06b6d4" }]}>{slaveCount}</Text>
          <Text style={styles.statLabel}>Slaves</Text>
        </View>
      </View>

      {/* Upstox Integration Card */}
      <View style={styles.upstoxCard}>
        <View style={styles.upstoxHeader}>
          <View style={styles.upstoxTitleRow}>
            <ShieldCheck size={20} color="#38bdf8" />
            <Text style={styles.upstoxTitle}>Upstox Live Stream & Chart</Text>
          </View>
          <View
            style={[
              styles.upstoxStatusBadge,
              { backgroundColor: upstoxConnected ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)" },
            ]}
          >
            <Text style={[styles.upstoxStatusText, { color: upstoxConnected ? "#10b981" : "#f43f5e" }]}>
              {upstoxConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.upstoxConfigBtn} onPress={() => setUpstoxModalVisible(true)}>
          <Key size={16} color="#090d16" />
          <Text style={styles.upstoxConfigText}>
            {upstoxConnected ? "Manage Upstox API Keys" : "Connect Upstox API"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Account Header & Action */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kotak Accounts</Text>
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity style={styles.loginAllBtn} onPress={handleLoginAll}>
            <Zap size={14} color="#38bdf8" />
            <Text style={styles.loginAllText}>Login All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addAccountBtn} onPress={handleOpenAdd}>
            <UserPlus size={14} color="#090d16" />
            <Text style={styles.addAccountText}>Add</Text>
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
            <View style={styles.accountCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTitleCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.accountNickname}>{item.nickname}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: isMaster ? "rgba(245, 158, 11, 0.2)" : "rgba(6, 182, 212, 0.2)" },
                      ]}
                    >
                      <Text style={[styles.roleBadgeText, { color: isMaster ? "#f59e0b" : "#06b6d4" }]}>
                        {item.role.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.accountUcc}>UCC: {item.ucc} • Mobile: {item.mobileNumber}</Text>
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
  upstoxCard: {
    backgroundColor: "#0f172a",
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
  },
  upstoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  upstoxTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  upstoxTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
  },
  upstoxStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upstoxStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  upstoxConfigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#38bdf8",
    paddingVertical: 10,
    borderRadius: 8,
  },
  upstoxConfigText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#090d16",
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
