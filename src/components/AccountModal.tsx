import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { ApiService } from "../services/api";
import { AccountSummary } from "../types";
import { X, UserPlus, Save } from "lucide-react-native";

interface AccountModalProps {
  visible: boolean;
  editingAccount?: AccountSummary | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  visible,
  editingAccount,
  onClose,
  onSuccess,
}) => {
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState<"master" | "slave">("slave");
  const [mobileNumber, setMobileNumber] = useState("");
  const [ucc, setUcc] = useState("");
  const [multiplier, setMultiplier] = useState("1.0");
  const [consumerKey, setConsumerKey] = useState("");
  const [mpin, setMpin] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [autoTotpEnabled, setAutoTotpEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setNickname(editingAccount.nickname || "");
      setRole(editingAccount.role || "slave");
      setMobileNumber(editingAccount.mobileNumber || "");
      setUcc(editingAccount.ucc || "");
      setMultiplier(String(editingAccount.multiplier || 1.0));
      setConsumerKey(editingAccount.consumerKey || "");
      setMpin(editingAccount.mpin || "");
      setTotpSecret(editingAccount.totpSecret || "");
      setAutoTotpEnabled(editingAccount.hasAutoTotpSecret ?? true);
    } else {
      setNickname("");
      setRole("slave");
      setMobileNumber("");
      setUcc("");
      setMultiplier("1.0");
      setConsumerKey("");
      setMpin("");
      setTotpSecret("");
      setAutoTotpEnabled(true);
    }
  }, [editingAccount, visible]);

  const handleSubmit = async () => {
    if (!nickname.trim() || !mobileNumber.trim() || !ucc.trim()) {
      Alert.alert("Missing Fields", "Nickname, Mobile Number, and UCC are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nickname: nickname.trim(),
        role,
        mobileNumber: mobileNumber.trim(),
        ucc: ucc.trim(),
        multiplier: parseFloat(multiplier) || 1.0,
        consumerKey: consumerKey.trim(),
        mpin: mpin.trim(),
        totpSecret: totpSecret.trim(),
        hasAutoTotpSecret: autoTotpEnabled,
      };

      if (editingAccount) {
        await ApiService.updateAccount(editingAccount.id, payload);
      } else {
        await ApiService.addAccount(payload);
      }

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert("Error", e?.message || "Failed to save Kotak account.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <UserPlus size={20} color="#06b6d4" />
              <Text style={styles.headerTitle}>
                {editingAccount ? "Edit Kotak Neo Account" : "Add Kotak Neo Account"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nickname / Alias</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Master Trader"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Account Role</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === "master" && styles.activeMaster]}
                onPress={() => setRole("master")}
              >
                <Text style={[styles.roleText, role === "master" && styles.activeRoleText]}>MASTER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === "slave" && styles.activeSlave]}
                onPress={() => setRole("slave")}
              >
                <Text style={[styles.roleText, role === "slave" && styles.activeRoleText]}>SLAVE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.flexRow}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Client UCC</Text>
                <TextInput
                  style={styles.input}
                  value={ucc}
                  onChangeText={setUcc}
                  placeholder="Client Code"
                  placeholderTextColor="#64748b"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {role === "slave" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Lot Multiplier</Text>
                <TextInput
                  style={styles.input}
                  value={multiplier}
                  onChangeText={setMultiplier}
                  keyboardType="numeric"
                  placeholder="e.g. 1.0 or 2.5"
                  placeholderTextColor="#64748b"
                />
              </View>
            )}

            <Text style={styles.sectionDivider}>APIs & Authentication</Text>

            <Text style={styles.label}>Consumer Key</Text>
            <TextInput
              style={styles.input}
              value={consumerKey}
              onChangeText={setConsumerKey}
              placeholder="Neo Consumer Key"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <View style={styles.flexRow}>
              <View style={styles.flex1}>
                <Text style={styles.label}>6-Digit MPIN</Text>
                <TextInput
                  style={styles.input}
                  value={mpin}
                  onChangeText={setMpin}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  placeholder="MPIN"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>TOTP Secret</Text>
                <TextInput
                  style={styles.input}
                  value={totpSecret}
                  onChangeText={setTotpSecret}
                  secureTextEntry
                  placeholder="Base32 Secret"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto Generate TOTP Login</Text>
              <Switch
                value={autoTotpEnabled}
                onValueChange={setAutoTotpEnabled}
                trackColor={{ false: "#334155", true: "#0284c7" }}
                thumbColor={autoTotpEnabled ? "#38bdf8" : "#94a3b8"}
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <Save size={18} color="#090d16" />
            <Text style={styles.submitText}>
              {submitting ? "Saving..." : editingAccount ? "Update Account" : "Add Account"}
            </Text>
          </TouchableOpacity>
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
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
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
  scrollForm: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#f8fafc",
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeMaster: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "#f59e0b",
  },
  activeSlave: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "#06b6d4",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  activeRoleText: {
    color: "#f8fafc",
  },
  flexRow: {
    flexDirection: "row",
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 4,
  },
  sectionDivider: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
    marginTop: 16,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  switchLabel: {
    fontSize: 13,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#06b6d4",
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#090d16",
  },
});
