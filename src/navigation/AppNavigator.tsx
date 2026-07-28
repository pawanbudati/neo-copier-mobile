import React, { useState } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
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
}: {
  onOpenServerConfig: () => void;
  onOpenUpstoxConfig: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const { isLightTheme, toggleTheme, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.headerBg }]} edges={["top"]}>
      <StatusBar
        barStyle={isLightTheme ? "dark-content" : "light-content"}
        backgroundColor={colors.headerBg}
        translucent={false}
      />
      <AppHeader
        onOpenServerConfig={onOpenServerConfig}
        onOpenUpstoxConfig={onOpenUpstoxConfig}
        isLightTheme={isLightTheme}
        onToggleTheme={toggleTheme}
      />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {(props) => (
            <MainTabNavigator
              {...props}
              onOpenServerConfig={() => setServerModalVisible(true)}
              onOpenUpstoxConfig={() => setUpstoxModalVisible(true)}
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
  },
});
