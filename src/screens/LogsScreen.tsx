import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { SystemLog } from "../types";
import { ApiService } from "../services/api";
import {
  Terminal,
  Search,
  Pause,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react-native";
import { Alert } from "react-native";

export const LogsScreen: React.FC = () => {
  const { logs, refreshLogs } = useApp();
  const { isLightTheme, colors } = useTheme();

  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [paused, setPaused] = useState(false);

  const handleClearLogs = async () => {
    Alert.alert("Clear Logs", "Are you sure you want to truncate the server log file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear Logs",
        style: "destructive",
        onPress: async () => {
          try {
            await ApiService.clearLogs();
            await refreshLogs();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to clear logs.");
          }
        },
      },
    ]);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLevel === "ALL" || log.level === selectedLevel;
    const matchesSearch =
      !searchQuery.trim() ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getLevelBadge = (level: SystemLog["level"]) => {
    switch (level) {
      case "INFO":
        return <Text style={[styles.levelTag, { color: "#38bdf8" }]}>INFO</Text>;
      case "WARN":
        return <Text style={[styles.levelTag, { color: "#f59e0b" }]}>WARN</Text>;
      case "ERROR":
        return <Text style={[styles.levelTag, { color: "#f43f5e" }]}>ERROR</Text>;
      case "DEBUG":
        return <Text style={[styles.levelTag, { color: "#94a3b8" }]}>DEBUG</Text>;
      default:
        return <Text style={[styles.levelTag, { color: "#94a3b8" }]}>{level}</Text>;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Controls Bar */}
      <View style={[styles.controlsBar, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Filter log messages..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.actionRow}>
          <FlatList
            horizontal
            data={["ALL", "INFO", "WARN", "ERROR", "DEBUG"]}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.levelChips}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.levelChip,
                  { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder },
                  selectedLevel === item && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedLevel(item)}
              >
                <Text style={[styles.chipText, { color: colors.textSecondary }, selectedLevel === item && { color: colors.primary, fontWeight: "800" }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={[styles.pauseBtn, { backgroundColor: colors.cardBgSecondary, borderColor: colors.cardBorder }, paused && { backgroundColor: colors.successLight, borderColor: colors.success }]}
            onPress={() => setPaused(!paused)}
          >
            {paused ? <Play size={14} color={colors.success} /> : <Pause size={14} color={colors.textMuted} />}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: colors.primaryLight }]} onPress={refreshLogs}>
            <RefreshCw size={14} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]} onPress={handleClearLogs}>
            <Trash2 size={14} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs Terminal Feed */}
      <FlatList
        data={paused ? logs : filteredLogs}
        keyExtractor={(item, index) => item.id || String(index)}
        contentContainerStyle={styles.logList}
        renderItem={({ item }) => (
          <View style={[styles.logRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              {item.timestamp ? item.timestamp.split("T")[1]?.slice(0, 8) : "--:--:--"}
            </Text>
            {getLevelBadge(item.level)}
            <Text style={[styles.logMessage, { color: colors.textPrimary }]}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Terminal size={36} color={colors.cardBorder} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No System Logs Available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050811",
  },
  controlsBar: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: "#f8fafc",
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelChips: {
    gap: 6,
  },
  levelChip: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeChip: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "#06b6d4",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeChipText: {
    color: "#38bdf8",
    fontWeight: "800",
  },
  pauseBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#1e293b",
  },
  activePauseBtn: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#1e293b",
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
  },
  logList: {
    padding: 12,
    gap: 6,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  timestamp: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#64748b",
    width: 65,
  },
  levelTag: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "800",
    width: 44,
  },
  logMessage: {
    flex: 1,
    fontSize: 12,
    fontFamily: "monospace",
    color: "#e2e8f0",
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 10,
  },
});
