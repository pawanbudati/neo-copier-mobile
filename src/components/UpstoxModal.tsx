import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from "react-native";
import { ApiService } from "../services/api";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { X, ShieldCheck, ExternalLink, KeyRound } from "lucide-react-native";

interface UpstoxModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UpstoxModal: React.FC<UpstoxModalProps> = ({ visible, onClose }) => {
  const { upstoxConnected, upstoxAuthUrl, refreshUpstoxStatus } = useApp();
  const { isLightTheme, colors } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      ApiService.getUpstoxConfig()
        .then((cfg) => {
          if (cfg) {
            if (cfg.apiKey) setApiKey(cfg.apiKey);
            if (cfg.apiSecret) setApiSecret(cfg.apiSecret);
            if (cfg.redirectUri) setRedirectUri(cfg.redirectUri);
          }
        })
        .catch(() => {});
    }
  }, [visible]);

  const handleSaveCredentials = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      Alert.alert("Missing Keys", "API Key and API Secret are required.");
      return;
    }
    setSubmitting(true);
    try {
      await ApiService.addUpstoxAccount({
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        redirectUri: redirectUri.trim() || "http://localhost:8080/api/upstox/callback",
      });
      await refreshUpstoxStatus();
      setSubmitting(false);
      Alert.alert("Success", "Upstox API keys saved. Please obtain Auth Code to finish login.");
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert("Error", e?.message || "Failed to save Upstox keys.");
    }
  };

  const handleExchangeCode = async () => {
    if (!authCode.trim()) {
      Alert.alert("Missing Code", "Please paste the Auth Code from Upstox OAuth redirect.");
      return;
    }
    setSubmitting(true);
    try {
      await ApiService.submitUpstoxAuthCode(authCode.trim());
      await refreshUpstoxStatus();
      setSubmitting(false);
      Alert.alert("Authenticated!", "Upstox account authenticated successfully!");
      onClose();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert("Auth Failed", e?.message || "Invalid Upstox Auth Code.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ShieldCheck size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Upstox API Integration</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.cardBgSecondary }]}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.statusBox, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Connection Status:</Text>
            <Text style={[styles.statusBadge, { color: upstoxConnected ? colors.success : colors.danger }]}>
              {upstoxConnected ? "AUTHENTICATED" : "NOT AUTHENTICATED"}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Upstox API Key</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Upstox API Key"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Upstox API Secret</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
            value={apiSecret}
            onChangeText={setApiSecret}
            secureTextEntry
            placeholder="Upstox API Secret"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.saveKeysBtn} onPress={handleSaveCredentials} disabled={submitting}>
            <KeyRound size={16} color="#f8fafc" />
            <Text style={styles.saveKeysText}>Save API Credentials</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>OAuth Code Login</Text>

          <Text style={styles.label}>Paste Auth Code / Redirect URL</Text>
          <TextInput
            style={styles.input}
            value={authCode}
            onChangeText={setAuthCode}
            placeholder="Paste code from Upstox redirect URL"
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity style={styles.submitCodeBtn} onPress={handleExchangeCode} disabled={submitting}>
            <ExternalLink size={16} color="#090d16" />
            <Text style={styles.submitCodeText}>
              {submitting ? "Exchanging Code..." : "Authenticate Upstox Account"}
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
  statusBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 8,
    marginBottom: 4,
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
  saveKeysBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#334155",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  saveKeysText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#38bdf8",
    marginBottom: 6,
  },
  submitCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#38bdf8",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  submitCodeText: {
    color: "#090d16",
    fontSize: 13,
    fontWeight: "800",
  },
});
