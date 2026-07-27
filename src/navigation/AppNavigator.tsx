import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, StatusBar } from "react-native";
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
import { TrendingUp, Users, ShoppingBag, Terminal } from "lucide-react-native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator({ onOpenServerConfig }: { onOpenServerConfig: () => void }) {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <AppHeader onOpenServerConfig={onOpenServerConfig} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0f172a",
            borderTopColor: "#1e293b",
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: "#06b6d4",
          tabBarInactiveTintColor: "#64748b",
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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {(props) => (
            <MainTabNavigator
              {...props}
              onOpenServerConfig={() => setServerModalVisible(true)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="LiveChart" component={LiveChartScreen} />
      </Stack.Navigator>

      <ServerConfigModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
});
