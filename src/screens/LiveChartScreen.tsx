import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useApp } from "../context/AppContext";
import { OrderPlacementModal } from "../components/OrderPlacementModal";
import { ApiService } from "../services/api";
import { ScripInfo } from "../types";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart2, RefreshCw } from "lucide-react-native";

export const LiveChartScreen: React.FC<any> = ({ route, navigation }) => {
  const { scrip } = route.params || {};
  const { quotes, serverUrl } = useApp();

  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h">("1m");
  const [candles, setCandles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Order modal state
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const webViewRef = useRef<any>(null);

  const symbol = scrip?.scripRefKey || scrip?.tradingSymbol || scrip?.symbol || "NIFTY";
  const liveQuote = quotes[scrip?.scriptToken] || quotes[symbol];

  // Fetch OHLC candles
  useEffect(() => {
    let active = true;
    setLoading(true);
    const token = scrip?.scriptToken || "";
    const exch = scrip?.exchange || "";
    const seg = scrip?.segment || "";
    ApiService.getCandles(token, symbol, exch, seg, timeframe)
      .then((data) => {
        if (active && Array.isArray(data)) {
          setCandles(data);
          injectCandlesToWebView(data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load candles", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scrip, symbol, timeframe]);

  // Inject live quote updates into WebView
  useEffect(() => {
    if (liveQuote && liveQuote.ltp && webViewRef.current) {
      const updateScript = `
        if (window.updateLiveTick) {
          window.updateLiveTick(${liveQuote.ltp});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(updateScript);
    }
  }, [liveQuote]);

  const injectCandlesToWebView = (candleData: any[]) => {
    if (webViewRef.current) {
      const jsonStr = JSON.stringify(candleData);
      const script = `
        if (window.loadCandles) {
          window.loadCandles(${jsonStr});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const chartHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #090d16; overflow: hidden; }
          #chart { width: 100%; height: 100%; }
        </style>
        <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
      </head>
      <body>
        <div id="chart"></div>
        <script>
          let chart;
          let candleSeries;
          let currentCandle = null;

          function initChart() {
            const container = document.getElementById('chart');
            chart = LightweightCharts.createChart(container, {
              width: container.clientWidth,
              height: container.clientHeight,
              layout: {
                background: { type: 'solid', color: '#090d16' },
                textColor: '#94a3b8',
                fontFamily: 'sans-serif',
              },
              grid: {
                vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
                horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
              },
              crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
              },
              rightPriceScale: {
                borderColor: '#1e293b',
              },
              timeScale: {
                borderColor: '#1e293b',
                timeVisible: true,
                secondsVisible: false,
              },
            });

            candleSeries = chart.addCandlestickSeries({
              upColor: '#10b981',
              downColor: '#f43f5e',
              borderVisible: false,
              wickUpColor: '#10b981',
              wickDownColor: '#f43f5e',
            });

            window.addEventListener('resize', () => {
              chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
            });
          }

          window.loadCandles = function(data) {
            if (!candleSeries) initChart();
            if (Array.isArray(data) && data.length > 0) {
              const formatted = data.map(item => ({
                time: item.time,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close
              }));
              candleSeries.setData(formatted);
              chart.timeScale().fitContent();
              currentCandle = formatted[formatted.length - 1];
            }
          };

          window.updateLiveTick = function(ltp) {
            if (!candleSeries || !currentCandle) return;
            currentCandle.high = Math.max(currentCandle.high, ltp);
            currentCandle.low = Math.min(currentCandle.low, ltp);
            currentCandle.close = ltp;
            candleSeries.update(currentCandle);
          };

          document.addEventListener("DOMContentLoaded", initChart);
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Chart Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <Text style={styles.symbolTitle}>{symbol}</Text>
          <Text style={styles.priceSub}>
            LTP: ₹{liveQuote?.ltp ? liveQuote.ltp.toFixed(2) : "--.--"}
          </Text>
        </View>

        {/* Timeframe Chips */}
        <View style={styles.tfContainer}>
          {(["1m", "5m", "15m", "1h"] as const).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.tfChip, timeframe === tf && styles.activeTfChip]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[styles.tfText, timeframe === tf && styles.activeTfText]}>{tf}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* WebView Chart */}
      <View style={styles.chartWrapper}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: chartHtml }}
          style={styles.webView}
          onLoadEnd={() => {
            if (candles.length > 0) injectCandlesToWebView(candles);
          }}
        />
      </View>

      {/* Quick Trade Bar */}
      <View style={styles.tradeBar}>
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => {
            setOrderSide("BUY");
            setOrderModalVisible(true);
          }}
        >
          <TrendingUp size={18} color="#090d16" />
          <Text style={styles.tradeText}>QUICK BUY</Text>
        </TouchableOpacity>
      </View>

      {/* Order Ticket Modal */}
      <OrderPlacementModal
        visible={orderModalVisible}
        initialScrip={scrip}
        initialSide={orderSide}
        onClose={() => setOrderModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  titleCol: {
    flex: 1,
  },
  symbolTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
  },
  priceSub: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "700",
  },
  tfContainer: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 3,
  },
  tfChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeTfChip: {
    backgroundColor: "#06b6d4",
  },
  tfText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  activeTfText: {
    color: "#090d16",
    fontWeight: "800",
  },
  chartWrapper: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  tradeBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  buyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 10,
  },
  sellBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f43f5e",
    paddingVertical: 12,
    borderRadius: 10,
  },
  tradeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#090d16",
  },
});
