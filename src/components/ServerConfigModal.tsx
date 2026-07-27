import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from "react-native";
import { useApp } from "../context/AppContext";
import { Server, X, Check, Globe, Cloud } from "lucide-react-native";

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ visible, onClose }) => {
  const { serverUrl, updateServerUrl, isConnected } = useApp();
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (visible) {
      setInputUrl(serverUrl);
    }
  }, [visible, serverUrl]);

  const handleSave = async () => {
    if (!inputUrl.trim()) {
      Alert.alert("Invalid URL", "Please enter a valid backend host server URL.");
      return;
    }
    setTesting(true);
    try {
      await updateServerUrl(inputUrl.trim());
      setTesting(false);
      onClose();
    } catch (e: any) {
      setTesting(false);
      Alert.alert("Connection Failed", `Could not connect to ${inputUrl}.\nError: ${e.message}`);
    }
  };

  const handlePreset = (presetUrl: string) => {
    setInputUrl(presetUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Server size={20} color="#06b6d4" />
              <Text style={styles.modalTitle}>Backend Server Configuration</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Enter the Cloud VM Instance IP or local host URL where your Neo-Copier Java Backend is running.
          </Text>

          {/* Active URL Badge */}
          <View style={styles.activeUrlBox}>
            <Cloud size={14} color="#38bdf8" />
            <Text style={styles.activeUrlLabel}>Active Backend URL:</Text>
            <Text style={styles.activeUrlValue} numberOfLines={1}>
              {serverUrl || "https://neo-copier.duckdns.org"}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Globe size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="e.g. https://neo-copier.duckdns.org"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.presetLabel}>Quick Presets:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity style={[styles.presetChip, { borderColor: "#06b6d4", backgroundColor: "rgba(6, 182, 212, 0.15)" }]} onPress={() => handlePreset("https://neo-copier.duckdns.org")}>
              <Text style={[styles.presetText, { color: "#06b6d4", fontWeight: "700" }]}>GCP Cloud Instance (duckdns.org)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handlePreset("http://192.168.0.195:3000")}>
              <Text style={styles.presetText}>LAN Wi-Fi (192.168.0.195:3000)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handlePreset("http://10.0.2.2:3000")}>
              <Text style={styles.presetText}>Android Emulator (10.0.2.2:3000)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection Status:</Text>
            <Text style={[styles.statusVal, { color: isConnected ? "#10b981" : "#ef4444" }]}>
              {isConnected ? "Connected • Online" : "Disconnected • Offline"}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={testing}>
              <Check size={18} color="#090d16" />
              <Text style={styles.saveText}>{testing ? "Testing..." : "Save & Connect"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 12,
    lineHeight: 18,
  },
  activeUrlBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  activeUrlLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  activeUrlValue: {
    fontSize: 12,
    color: "#38bdf8",
    fontWeight: "800",
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: "#f8fafc",
    fontSize: 14,
  },
  presetLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: "rgba(51, 65, 85, 0.5)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  presetText: {
    fontSize: 11,
    color: "#38bdf8",
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  statusVal: {
    fontSize: 12,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1e293b",
  },
  cancelText: {
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: 13,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#06b6d4",
  },
  saveText: {
    color: "#090d16",
    fontWeight: "700",
    fontSize: 13,
  },
});
