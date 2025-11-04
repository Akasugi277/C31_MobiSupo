// src/screens/HomeScreen.tsx
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleCalendarAuth from "../components/GoogleCalendarAuth";
import ShadowView from "../components/ShadowView";
import { ThemeContext } from "../components/ThemeContext";
import {
  CalendarEvent,
  fetchCalendarEvents,
} from "../services/calendarService";
import {
  clearGoogleCalendarToken,
  getGoogleCalendarToken,
  isGoogleCalendarAuthenticated,
  saveGoogleCalendarToken,
} from "../services/storageService";
import {
  AddressData,
  getCurrentAddress,
  getCurrentWeather,
  WeatherData,
} from "../services/weatherService";

export default function HomeScreen() {
  const { theme } = useContext(ThemeContext);
  const textColor = theme === "light" ? "#000" : "#fff";
  const bgColor = theme === "light" ? "#fff" : "#333";

  // 天気と住所の状態管理
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Google Calendar関連の状態管理
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 天気と住所を取得する関数
  const fetchWeatherAndAddress = async () => {
    try {
      const [weatherData, addressData] = await Promise.all([
        getCurrentWeather(),
        getCurrentAddress(),
      ]);
      setWeather(weatherData);
      setAddress(addressData);
    } catch (error) {
      console.error("天気または住所の取得に失敗:", error);
    }
  };

  // Google Calendarの予定を取得する関数
  const fetchCalendarData = async () => {
    try {
      const authenticated = await isGoogleCalendarAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const token = await getGoogleCalendarToken();
        if (token) {
          const events = await fetchCalendarEvents(token, 20);
          setCalendarEvents(events);
          console.log(`Google Calendarから${events.length}件の予定を取得しました`);
        }
      }
    } catch (error) {
      console.error("カレンダー情報の取得に失敗:", error);
      // トークンが無効な場合は削除
      await clearGoogleCalendarToken();
      setIsAuthenticated(false);
    }
  };

  // 初回レンダリング時に天気と住所、カレンダーを取得
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchWeatherAndAddress(), fetchCalendarData()]);
      setLoading(false);
    };

    initialize();
  }, []);

  // スワイプで更新する処理
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWeatherAndAddress(), fetchCalendarData()]);
    setRefreshing(false);
  };

  // Google Calendar認証成功時の処理
  const handleAuthSuccess = async (accessToken: string) => {
    await saveGoogleCalendarToken(accessToken);
    setShowAuthModal(false);
    setIsAuthenticated(true);
    // 認証後にカレンダー情報を取得
    await fetchCalendarData();
  };

  // Google Calendar連携解除
  const handleDisconnectCalendar = () => {
    Alert.alert(
      "Google Calendar連携解除",
      "Google Calendarとの連携を解除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "解除する",
          style: "destructive",
          onPress: async () => {
            await clearGoogleCalendarToken();
            setIsAuthenticated(false);
            setCalendarEvents([]);
            Alert.alert("成功", "Google Calendarとの連携を解除しました");
          },
        },
      ]
    );
  };

  // Google Calendarのイベントを今日と明日に分類
  const getTodayEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    });
  };

  const getTomorrowEvents = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
    });
  };

  // イベントを時刻文字列に変換
  const formatEventTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const todayEvents = getTodayEvents();
  const tomorrowEvents = getTomorrowEvents();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: bgColor }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
            colors={[textColor]}
          />
        }
      >
        {/* 現在地＋天気ヘッダー */}
        <ShadowView style={[styles.header, { backgroundColor: bgColor }]}>
          <Text style={[styles.headerText, { color: textColor }]}>
            {loading
              ? "読み込み中..."
              : `現在地: ${
                  address?.fullAddress || "不明/位置情報を取得できませんでした"
                } | ${weather?.emoji || "🌡"} ${
                  weather?.temperature.toFixed(1) || "--"
                }°C（${weather?.description || "不明"}）`}
          </Text>
        </ShadowView>

        {/* Google Calendar連携ボタン */}
        <ShadowView style={[styles.calendarBox, { backgroundColor: bgColor }]}>
          {isAuthenticated ? (
            <View style={styles.calendarConnected}>
              <Text style={[styles.calendarText, { color: textColor }]}>
                Google Calendar連携済み（{calendarEvents.length}件の予定）
              </Text>
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnectCalendar}
              >
                <Text style={styles.disconnectButtonText}>連携解除</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.calendarNotConnected}>
              <Text style={[styles.calendarText, { color: textColor }]}>
                Google Calendarと連携していません
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => setShowAuthModal(true)}
              >
                <Text style={styles.connectButtonText}>連携する</Text>
              </TouchableOpacity>
            </View>
          )}
        </ShadowView>
        {/* 出発カウントダウン */}
        <ShadowView style={[styles.countdownBox, { backgroundColor: bgColor }]}>
          <Text style={[styles.countdownLabel, { color: textColor }]}>
            次の出発まで: <Text style={styles.countdownTime}>13分</Text>
          </Text>
          <TouchableOpacity style={styles.departButton}>
            <Text style={styles.departButtonText}>今すぐ出発</Text>
          </TouchableOpacity>
        </ShadowView>
        {/* 今日の予定 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              本日 {new Date().toLocaleDateString("ja-JP")}
            </Text>
          </View>
          {todayEvents.length > 0 ? (
            todayEvents.map((event) => (
              <ShadowView
                key={event.id}
                style={[styles.itemBox, { backgroundColor: bgColor }]}
              >
                <Text style={[styles.itemTime, { color: textColor }]}>
                  ▶ {formatEventTime(event.start)} {event.title}
                </Text>
                {event.location && (
                  <Text style={[styles.itemDetail, { color: textColor }]}>
                    └ 場所: {event.location}
                  </Text>
                )}
                {event.description && (
                  <Text style={[styles.itemDetail, { color: textColor }]}>
                    └ {event.description}
                  </Text>
                )}
              </ShadowView>
            ))
          ) : (
            <ShadowView
              style={[styles.itemBox, { backgroundColor: bgColor }]}
            >
              <Text style={[styles.itemTime, { color: textColor }]}>
                {isAuthenticated
                  ? "今日の予定はありません"
                  : "Google Calendarと連携して予定を表示"}
              </Text>
            </ShadowView>
          )}
        </View>
        {/* 明日の予定 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              明日 {new Date(Date.now() + 86400000).toLocaleDateString("ja-JP")}の予定
            </Text>
          </View>
          {tomorrowEvents.length > 0 ? (
            tomorrowEvents.map((event) => (
              <ShadowView
                key={event.id}
                style={[styles.itemBox, { backgroundColor: bgColor }]}
              >
                <Text style={[styles.itemTime, { color: textColor }]}>
                  ▶ {formatEventTime(event.start)} {event.title}
                </Text>
                {event.location && (
                  <Text style={[styles.itemDetail, { color: textColor }]}>
                    └ 場所: {event.location}
                  </Text>
                )}
                {event.description && (
                  <Text style={[styles.itemDetail, { color: textColor }]}>
                    └ {event.description}
                  </Text>
                )}
              </ShadowView>
            ))
          ) : (
            <ShadowView
              style={[styles.itemBox, { backgroundColor: bgColor }]}
            >
              <Text style={[styles.itemTime, { color: textColor }]}>
                {isAuthenticated
                  ? "明日の予定はありません"
                  : "Google Calendarと連携して予定を表示"}
              </Text>
            </ShadowView>
          )}
        </View>
        {/* サマリー */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>サマリー</Text>
          </View>
          <ShadowView style={[styles.summaryBox, { backgroundColor: bgColor }]}>
            <Text style={[styles.summaryText, { color: textColor }]}>
              今日の予定：{todayEvents.length}件
            </Text>
            <Text style={[styles.summaryText, { color: textColor }]}>
              明日の予定：{tomorrowEvents.length}件
            </Text>
            <Text style={[styles.summaryText, { color: textColor }]}>
              全予定：{calendarEvents.length}件
            </Text>
          </ShadowView>
        </View>
      </ScrollView>

      {/* Google Calendar認証モーダル */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: bgColor }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Google Calendar連携
            </Text>
            <TouchableOpacity onPress={() => setShowAuthModal(false)}>
              <Text style={[styles.closeButton, { color: textColor }]}>
                閉じる
              </Text>
            </TouchableOpacity>
          </View>
          <GoogleCalendarAuth onAuthSuccess={handleAuthSuccess} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: { flex: 1 },
  scroll: {
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 60, // iOSで縮める
  },
  header: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
  },
  countdownBox: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  countdownLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  countdownTime: {
    fontWeight: "bold",
  },
  departButton: {
    backgroundColor: "#007aff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  departButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    backgroundColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  sectionHeaderText: {
    color: "#fff",
    fontSize: 14,
  },
  itemBox: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  itemTime: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemDetail: {
    fontSize: 13,
    marginLeft: 8,
  },
  itemBadge: {
    fontSize: 13,
    marginLeft: 8,
    marginTop: 4,
  },
  summaryBox: {
    padding: 10,
    borderRadius: 6,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  moreButton: {
    alignSelf: "flex-end",
    padding: 6,
  },
  calendarBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  calendarConnected: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calendarNotConnected: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calendarText: {
    fontSize: 14,
    flex: 1,
  },
  connectButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disconnectButton: {
    backgroundColor: "#EA4335",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 16,
    color: "#007aff",
  },
});
