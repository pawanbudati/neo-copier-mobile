import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { CheckCircle2, AlertCircle, Info } from "lucide-react-native";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  text: string;
  type?: ToastType;
}

interface ToastProps {
  toast: ToastMessage | null;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onHide }) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return <AlertCircle size={18} color="#f43f5e" />;
      case "info":
        return <Info size={18} color="#38bdf8" />;
      case "success":
      default:
        return <CheckCircle2 size={18} color="#10b981" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "error":
        return "rgba(244, 63, 94, 0.4)";
      case "info":
        return "rgba(56, 189, 248, 0.4)";
      case "success":
      default:
        return "rgba(16, 185, 129, 0.4)";
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.text} numberOfLines={2}>
          {toast.text}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
