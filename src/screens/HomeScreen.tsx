// src/screens/HomeScreen.tsx
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import AddEventModal, { EventData } from "../components/AddEventModal";
import GoogleCalendarAuth from "../components/GoogleCalendarAuth";
import ShadowView from "../components/ShadowView";
import { ThemeContext } from "../components/ThemeContext";
import * as authService from "../services/authService";
import {
  CalendarEvent,
  fetchCalendarEvents,
} from "../services/calendarService";
import {
  clearGoogleCalendarToken,
  getEvents,
  getGoogleCalendarToken,
  isGoogleCalendarAuthenticated,
  saveEvents,
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

  // ローカル予定の状態管理
  const [localEvents, setLocalEvents] = useState<EventData[]>([]);

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
          console.log(
            `Google Calendarから${events.length}件の予定を取得しました`,
          );
        }
      }
    } catch (error) {
      console.error("カレンダー情報の取得に失敗:", error);
      // トークンが無効な場合は削除
      await clearGoogleCalendarToken();
      setIsAuthenticated(false);
    }
  };

  // ローカル予定を取得する関数
  const fetchLocalEvents = async () => {
    try {
      // 現在のユーザーIDを取得
      const user = await authService.getCurrentUser();
      if (!user) {
        console.log("ログインしていません");
        setLocalEvents([]);
        return;
      }

      const events = await getEvents(user.id);
      setLocalEvents(events);
      console.log(
        `ローカルから${events.length}件の予定を取得しました (userId: ${user.id})`,
      );
    } catch (error) {
      console.error("ローカル予定の取得に失敗:", error);
    }
  };

  // 初回レンダリング時に天気と住所、カレンダーを取得
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        fetchWeatherAndAddress(),
        fetchCalendarData(),
        fetchLocalEvents(),
      ]);
      setLoading(false);
    };

    initialize();
  }, []);

  // 画面がフォーカスされたときにローカル予定を再読み込み
  useFocusEffect(
    useCallback(() => {
      fetchLocalEvents();
    }, []),
  );

  // スワイプで更新する処理
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWeatherAndAddress(),
      fetchCalendarData(),
      fetchLocalEvents(),
    ]);
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
      ],
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

  // ローカル予定を今日と明日に分類
  const getTodayLocalEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return localEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= today && eventDate < tomorrow;
    });
  };

  const getTomorrowLocalEvents = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return localEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
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
  const todayLocalEvents = getTodayLocalEvents();
  const tomorrowLocalEvents = getTomorrowLocalEvents();

  // カウントダウン用: 現在時刻を毎分更新
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // 予定ずらしモーダル関連
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftMinutes, setShiftMinutes] = useState(15);
  const [fixEndTime, setFixEndTime] = useState(false);

  // 予定編集モーダル関連
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

  // 次の予定までのカウントダウンテキストを計算（予定オブジェクトも返す）
  const countdownInfo = useMemo(() => {
    // ローカル予定とGoogle Calendar予定の両方から、現在時刻より後の最も近い予定を探す
    let nextDepartureTime: Date | null = null;
    let nextEventTitle = "";
    let nextEvent: EventData | null = null;
    let isLocalEvent = false;

    // ローカル予定
    for (const event of localEvents) {
      const departureTime = new Date(event.startTime);
      if (event.travelTime && event.travelTime > 0) {
        departureTime.setMinutes(departureTime.getMinutes() - event.travelTime);
      }
      if (departureTime > now) {
        if (!nextDepartureTime || departureTime < nextDepartureTime) {
          nextDepartureTime = departureTime;
          nextEventTitle = event.title;
          nextEvent = event;
          isLocalEvent = true;
        }
      }
    }

    // Google Calendar予定
    for (const event of calendarEvents) {
      const eventStart = new Date(event.start);
      if (eventStart > now) {
        if (!nextDepartureTime || eventStart < nextDepartureTime) {
          nextDepartureTime = eventStart;
          nextEventTitle = event.title;
          nextEvent = null; // Google Calendarの予定はずらせない
          isLocalEvent = false;
        }
      }
    }

    if (!nextDepartureTime) {
      return null; // 今後の予定なし
    }

    const diffMs = nextDepartureTime.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    let timeText: string;
    if (diffMin < 60) {
      timeText = `${diffMin}分`;
    } else {
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      timeText = mins === 0 ? `${hours}時間` : `${hours}時間${mins}分`;
    }

    return { time: timeText, title: nextEventTitle, event: nextEvent, isLocalEvent };
  }, [now, localEvents, calendarEvents]);

  // 予定をずらす処理
  const handleShiftEvent = async () => {
    if (!countdownInfo?.event) return;

    const event = countdownInfo.event;
    const user = await authService.getCurrentUser();
    if (!user) return;

    // 予定の開始・終了時刻をずらす
    const newStartTime = new Date(event.startTime);
    newStartTime.setMinutes(newStartTime.getMinutes() + shiftMinutes);

    let newEndTime: Date;
    if (fixEndTime) {
      // 終了時刻は固定
      newEndTime = new Date(event.endTime);
    } else {
      // 終了時刻もずらす
      newEndTime = new Date(event.endTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + shiftMinutes);
    }

    // イベントを更新
    const updatedEvent: EventData = {
      ...event,
      startTime: newStartTime,
      endTime: newEndTime,
    };

    // ローカル予定を更新
    const updatedEvents = localEvents.map((e) =>
      e.id === event.id ? updatedEvent : e
    );
    await saveEvents(updatedEvents, user.id);
    setLocalEvents(updatedEvents);

    setShowShiftModal(false);
    Alert.alert(
      "予定をずらしました",
      `${event.title}を${shiftMinutes}分後ろにずらしました`
    );
  };

  // 予定を編集モーダルで開く
  const handleOpenEditModal = () => {
    if (countdownInfo?.event) {
      setEditingEvent(countdownInfo.event);
      setShowEditModal(true);
    }
  };

  // 予定編集後の保存処理
  const handleSaveEditedEvent = async (updatedEvent: EventData) => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const updatedEvents = localEvents.map((e) =>
      e.id === updatedEvent.id ? updatedEvent : e
    );
    await saveEvents(updatedEvents, user.id);
    setLocalEvents(updatedEvents);
    setShowEditModal(false);
    setEditingEvent(null);
  };

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
          {countdownInfo ? (
            <>
              <Text style={[styles.countdownLabel, { color: textColor }]}>
                次の予定まで: <Text style={styles.countdownTime}>{countdownInfo.time}</Text>
              </Text>
              <Text style={[{ color: textColor, fontSize: 13, marginTop: 2 }]}>
                {countdownInfo.title}
              </Text>
              {/* ローカル予定の場合のみボタンを表示 */}
              {countdownInfo.isLocalEvent && countdownInfo.event && (
                <View style={styles.countdownButtons}>
                  <TouchableOpacity
                    style={[styles.shiftButton, { backgroundColor: "#ff9500" }]}
                    onPress={() => setShowShiftModal(true)}
                  >
                    <Text style={styles.shiftButtonText}>予定をずらす</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: "#007aff" }]}
                    onPress={handleOpenEditModal}
                  >
                    <Text style={styles.editButtonText}>編集</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.countdownLabel, { color: textColor }]}>
              今後の予定はありません
            </Text>
          )}
        </ShadowView>
        {/* 今日の予定 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              本日 {new Date().toLocaleDateString("ja-JP")}
            </Text>
          </View>
          {/* Google Calendarの予定 */}
          {todayEvents.length > 0 &&
            todayEvents.map((event) => (
              <ShadowView
                key={`gcal-${event.id}`}
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
            ))}
          {/* ローカル予定 */}
          {todayLocalEvents.length > 0 &&
            todayLocalEvents.map((event) => (
              <ShadowView
                key={`local-${event.id}`}
                style={[styles.itemBox, { backgroundColor: bgColor }]}
              >
                <Text style={[styles.itemTime, { color: textColor }]}>
                  ▶ {formatEventTime(event.startTime)} {event.title}
                </Text>
                {event.location && (
                  <Text style={[styles.itemDetail, { color: textColor }]}>
                    └ 場所: {event.location}
                  </Text>
                )}
              </ShadowView>
            ))}
          {/* 予定がない場合 */}
          {todayEvents.length === 0 && todayLocalEvents.length === 0 && (
            <ShadowView style={[styles.itemBox, { backgroundColor: bgColor }]}>
              <Text style={[styles.itemTime, { color: textColor }]}>
                今日の予定はありません
              </Text>
            </ShadowView>
          )}
        </View>
        {/* 明日の予定 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              明日 {new Date(Date.now() + 86400000).toLocaleDateString("ja-JP")}
              の予定
            </Text>
          </View>
          {/* Google Calendarの予定 */}
          {tomorrowEvents.length > 0 &&
            tomorrowEvents.map((event) => (
              <ShadowView
                key={`gcal-${event.id}`}
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
            ))}
          {/* ローカル予定 */}
          {tomorrowLocalEvents.length > 0 &&
            tomorrowLocalEvents.map((event) => (
              <ShadowView
                key={`local-${event.id}`}
                style={[styles.itemBox, { backgroundColor: bgColor }]}
              >
                <Text style={[styles.itemTime, { color: textColor }]}>
                  ▶ {formatEventTime(event.startTime)} {event.title}
                </Text>
                {event.location && (
                  <Text style={[styles.itemDetail, { color: textColor }]}>
                    └ 場所: {event.location}
                  </Text>
                )}
              </ShadowView>
            ))}
          {/* 予定がない場合 */}
          {tomorrowEvents.length === 0 && tomorrowLocalEvents.length === 0 && (
            <ShadowView style={[styles.itemBox, { backgroundColor: bgColor }]}>
              <Text style={[styles.itemTime, { color: textColor }]}>
                明日の予定はありません
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
              今日の予定：{todayEvents.length + todayLocalEvents.length}件
            </Text>
            <Text style={[styles.summaryText, { color: textColor }]}>
              明日の予定：{tomorrowEvents.length + tomorrowLocalEvents.length}件
            </Text>
            <Text style={[styles.summaryText, { color: textColor }]}>
              全予定（Google）：{calendarEvents.length}件
            </Text>
            <Text style={[styles.summaryText, { color: textColor }]}>
              全予定（ローカル）：{localEvents.length}件
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

      {/* 予定ずらしモーダル */}
      <Modal
        visible={showShiftModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowShiftModal(false)}
      >
        <View style={styles.shiftModalOverlay}>
          <View style={[styles.shiftModalContent, { backgroundColor: bgColor }]}>
            <Text style={[styles.shiftModalTitle, { color: textColor }]}>
              予定をずらす
            </Text>
            {countdownInfo?.event && (
              <Text style={[styles.shiftModalEventTitle, { color: textColor }]}>
                {countdownInfo.event.title}
              </Text>
            )}
            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: textColor }]}>
                何分ずらしますか？
              </Text>
              <Picker
                selectedValue={shiftMinutes}
                onValueChange={(value) => setShiftMinutes(value)}
                style={[styles.picker, { color: textColor }]}
                itemStyle={{ color: textColor }}
              >
                <Picker.Item label="5分" value={5} />
                <Picker.Item label="10分" value={10} />
                <Picker.Item label="15分" value={15} />
                <Picker.Item label="20分" value={20} />
                <Picker.Item label="30分" value={30} />
                <Picker.Item label="45分" value={45} />
                <Picker.Item label="1時間" value={60} />
                <Picker.Item label="1時間30分" value={90} />
                <Picker.Item label="2時間" value={120} />
              </Picker>
            </View>
            <View style={styles.fixEndTimeRow}>
              <Text style={[styles.fixEndTimeLabel, { color: textColor }]}>
                終了時刻を固定する
              </Text>
              <Switch
                value={fixEndTime}
                onValueChange={setFixEndTime}
                trackColor={{ false: "#767577", true: "#ff9500" }}
                thumbColor={fixEndTime ? "#fff" : "#f4f3f4"}
              />
            </View>
            <View style={styles.shiftModalButtons}>
              <TouchableOpacity
                style={styles.shiftCancelButton}
                onPress={() => setShowShiftModal(false)}
              >
                <Text style={styles.shiftCancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shiftConfirmButton}
                onPress={handleShiftEvent}
              >
                <Text style={styles.shiftConfirmButtonText}>変更する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 予定編集モーダル */}
      {editingEvent && (
        <AddEventModal
          visible={showEditModal}
          selectedDate={editingEvent.startTime.toISOString().split("T")[0]}
          onClose={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEditedEvent}
          editingEvent={editingEvent}
        />
      )}
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
  // カウントダウンボタン
  countdownButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  shiftButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shiftButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // ずらしモーダル
  shiftModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shiftModalContent: {
    width: "85%",
    borderRadius: 14,
    padding: 20,
  },
  shiftModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  shiftModalEventTitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  picker: {
    height: 150,
  },
  fixEndTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    marginBottom: 16,
  },
  fixEndTimeLabel: {
    fontSize: 14,
    flex: 1,
  },
  shiftModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  shiftCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
  },
  shiftCancelButtonText: {
    fontSize: 16,
    color: "#333",
  },
  shiftConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ff9500",
    alignItems: "center",
  },
  shiftConfirmButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
