import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ThemeColors {
  isDark: boolean;
  background: string;
  cardBg: string;
  cardBgSecondary: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
  headerBorder: string;
  tabBarBg: string;
  tabBarBorder: string;
}

export const darkTheme: ThemeColors = {
  isDark: true,
  background: "#090d16",
  cardBg: "#0f172a",
  cardBgSecondary: "#161e31",
  cardBorder: "#1e293b",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  primary: "#06b6d4",
  primaryLight: "rgba(6, 182, 212, 0.15)",
  success: "#10b981",
  successLight: "rgba(16, 185, 129, 0.15)",
  danger: "#f43f5e",
  dangerLight: "rgba(244, 63, 94, 0.15)",
  warning: "#f59e0b",
  warningLight: "rgba(245, 158, 11, 0.15)",
  inputBg: "#1e293b",
  inputBorder: "#334155",
  headerBg: "#0f172a",
  headerBorder: "#1e293b",
  tabBarBg: "#0f172a",
  tabBarBorder: "#1e293b",
};

export const lightTheme: ThemeColors = {
  isDark: false,
  background: "#f1f5f9",
  cardBg: "#ffffff",
  cardBgSecondary: "#f8fafc",
  cardBorder: "#cbd5e1",
  textPrimary: "#0f172a",
  textSecondary: "#334155",
  textMuted: "#64748b",
  primary: "#0284c7",
  primaryLight: "rgba(2, 132, 199, 0.12)",
  success: "#059669",
  successLight: "rgba(5, 150, 105, 0.12)",
  danger: "#e11d48",
  dangerLight: "rgba(225, 29, 72, 0.12)",
  warning: "#d97706",
  warningLight: "rgba(217, 119, 6, 0.12)",
  inputBg: "#ffffff",
  inputBorder: "#cbd5e1",
  headerBg: "#ffffff",
  headerBorder: "#e2e8f0",
  tabBarBg: "#ffffff",
  tabBarBorder: "#e2e8f0",
};

interface ThemeContextType {
  isLightTheme: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@neo_copier_theme_mode";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLightTheme, setIsLightTheme] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((val) => {
        if (val === "light") setIsLightTheme(true);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setIsLightTheme((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? "light" : "dark").catch(() => {});
      return next;
    });
  };

  const colors = isLightTheme ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ isLightTheme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      isLightTheme: false,
      toggleTheme: () => {},
      colors: darkTheme,
    };
  }
  return context;
};
