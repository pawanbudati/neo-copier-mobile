import React, { useState } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TerminalScreen } from "../screens/TerminalScreen";
import { AccountsScreen } from "../screens/AccountsScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { LogsScreen } from "../screens/LogsScreen";
import { LiveChartScreen } from "../screens/LiveChartScreen";
import { AppHeader } from "../components/AppHeader";
import { ServerConfigModal } from "../components/ServerConfigModal";
import { UpstoxModal } from "../components/UpstoxModal";
import { TrendingUp, Users, ShoppingBag, Terminal } from "lucide-react-native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator({
  onOpenServerConfig,
  onOpenUpstoxConfig,
  isLightTheme,
  onToggleTheme,
}: {
  onOpenServerConfig: () => void;
  onOpenUpstoxConfig: () => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={[styles.safeContainer, isLightTheme && styles.safeContainerLight]} edges={["top"]}>
      <StatusBar
        barStyle={isLightTheme ? "dark-content" : "light-content"}
        backgroundColor={isLightTheme ? "#ffffff" : "#0f172a"}
        translucent={false}
      />
      <AppHeader
        onOpenServerConfig={onOpenServerConfig}
        onOpenUpstoxConfig={onOpenUpstoxConfig}
        isLightTheme={isLightTheme}
        onToggleTheme={onToggleTheme}
      />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isLightTheme ? "#ffffff" : "#0f172a",
            borderTopColor: isLightTheme ? "#e2e8f0" : "#1e293b",
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarActiveTintColor: "#06b6d4",
          tabBarInactiveTintColor: isLightTheme ? "#94a3b8" : "#64748b",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
          },
        }}
      >
        <Tab.Screen
          name="Terminal"
          component={TerminalScreen}
          options={{
            tabBarLabel: "Terminal",
            tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Accounts"
          component={AccountsScreen}
          options={{
            tabBarLabel: "Accounts",
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            tabBarLabel: "Orders",
            tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Logs"
          component={LogsScreen}
          options={{
            tabBarLabel: "Logs",
            tabBarIcon: ({ color, size }) => <Terminal size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export function AppNavigator() {
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [upstoxModalVisible, setUpstoxModalVisible] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {(props) => (
            <MainTabNavigator
              {...props}
              onOpenServerConfig={() => setServerModalVisible(true)}
              onOpenUpstoxConfig={() => setUpstoxModalVisible(true)}
              isLightTheme={isLightTheme}
              onToggleTheme={() => setIsLightTheme((prev) => !prev)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="LiveChart" component={LiveChartScreen} />
      </Stack.Navigator>

      <ServerConfigModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
      />

      <UpstoxModal
        visible={upstoxModalVisible}
        onClose={() => setUpstoxModalVisible(false)}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  safeContainerLight: {
    backgroundColor: "#ffffff",
  },
});
