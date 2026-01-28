// AddEventModal.tsx
// 新規予定作成モーダル（iOSカレンダー風デザイン）

import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as notificationService from "../services/notificationService";
import * as routeService from "../services/routeService";
import * as storageService from "../services/storageService";
import * as weatherService from "../services/weatherService";
import MapPickerModal from "./MapPickerModal";
import { ThemeContext } from "./ThemeContext";

interface AddEventModalProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD形式
  onClose: () => void;
  onSave: (event: EventData) => void;
  editingEvent?: EventData | null; // 編集時に渡されるイベント
}

export interface EventData {
  id: string;
  title: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  travelTime?: number;
  repeat?: "none" | "daily" | "weekly" | "monthly";
  notification: boolean;
  notificationMinutesBefore?: number;
  travelMode?: "walking" | "transit" | "driving";
  weather?: string;
  notificationIds?: {
    departure: string;
    preparation: string;
  };
  routes?: routeService.RouteInfo[];
  selectedRouteIndex?: number;
  memo?: string;
  isAllDay?: boolean;
}

// 移動時間の選択肢
const TRAVEL_TIME_OPTIONS = [
  { label: "なし", value: 0 },
  { label: "5分", value: 5 },
  { label: "15分", value: 15 },
  { label: "30分", value: 30 },
  { label: "1時間", value: 60 },
  { label: "1時間30分", value: 90 },
  { label: "2時間", value: 120 },
];

// 繰り返しの選択肢
const REPEAT_OPTIONS: {
  label: string;
  value: "none" | "daily" | "weekly" | "monthly";
}[] = [
  { label: "しない", value: "none" },
  { label: "毎日", value: "daily" },
  { label: "毎週", value: "weekly" },
  { label: "毎月", value: "monthly" },
];

// 通知の選択肢
const NOTIFICATION_OPTIONS = [
  { label: "なし", value: 0 },
  { label: "5分前", value: 5 },
  { label: "15分前", value: 15 },
  { label: "30分前", value: 30 },
  { label: "1時間前", value: 60 },
];

export default function AddEventModal({
  visible,
  selectedDate,
  onClose,
  onSave,
  editingEvent,
}: AddEventModalProps) {
  const { theme } = useContext(ThemeContext);

  // iOSカレンダー風カラー
  const screenBg = theme === "light" ? "#f2f2f7" : "#1c1c1e";
  const cardBg = theme === "light" ? "#fff" : "#2c2c2e";
  const textColor = theme === "light" ? "#000" : "#fff";
  const secondaryText = theme === "light" ? "#8e8e93" : "#8e8e93";
  const separatorColor = theme === "light" ? "#c6c6c8" : "#38383a";
  const headerBg = theme === "light" ? "#f2f2f7" : "#1c1c1e";
  const iconBg = theme === "light" ? "#e5e5ea" : "#3a3a3c";
  const accentColor = "#007AFF";
  const dateButtonBg = theme === "light" ? "#e8e8ed" : "#3a3a3c";

  // フォーム入力状態
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });
  const [travelTimeValue, setTravelTimeValue] = useState(0);
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">(
    "none",
  );
  const [notification, setNotification] = useState(true);
  const [notificationMinutesBefore, setNotificationMinutesBefore] =
    useState(15);

  // ピッカー表示状態
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ドロップダウン表示状態
  const [showTravelTimePicker, setShowTravelTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showNotificationPicker, setShowNotificationPicker] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // ルート計算の状態
  const [calculating, setCalculating] = useState(false);
  const [routeOptions, setRouteOptions] = useState<routeService.RouteInfo[]>(
    [],
  );
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null,
  );

  // 座標状態
  const [coordinates, setCoordinates] = useState<
    { latitude: number; longitude: number } | undefined
  >(undefined);

  // モーダルが開かれたときに時刻を初期化または編集データを設定
  useEffect(() => {
    if (visible) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setLocation(editingEvent.location || "");
        setMemo(editingEvent.memo || "");
        setIsAllDay(editingEvent.isAllDay || false);
        setStartTime(editingEvent.startTime);
        setEndTime(editingEvent.endTime);
        setTravelTimeValue(editingEvent.travelTime || 0);
        setRepeat(editingEvent.repeat || "none");
        setNotification(editingEvent.notification);
        setNotificationMinutesBefore(
          editingEvent.notificationMinutesBefore || 15,
        );
      } else {
        setTitle("");
        setLocation("");
        setMemo("");
        setIsAllDay(false);
        const now = new Date();
        setStartTime(now);
        const later = new Date();
        later.setHours(later.getHours() + 1);
        setEndTime(later);
        setTravelTimeValue(0);
        setRepeat("none");
        setNotification(true);
        setNotificationMinutesBefore(15);
      }
      // ピッカーを閉じる
      setShowStartPicker(false);
      setShowEndPicker(false);
      setShowTravelTimePicker(false);
      setShowRepeatPicker(false);
      setShowNotificationPicker(false);
    }
  }, [visible, editingEvent]);

  // 複数のルートを計算して表示
  const calculateRoute = async () => {
    if (!location.trim()) {
      Alert.alert("エラー", "場所を入力してください");
      return;
    }

    setCalculating(true);
    try {
      const currentLocation = await routeService.getCurrentLocation();
      const destinationCoords = await routeService.geocodeAddress(location);
      const routes = await routeService.searchMultipleRoutes(
        currentLocation,
        destinationCoords,
        startTime,
      );

      if (routes.length === 0) {
        Alert.alert(
          "エラー",
          "ルートが見つかりませんでした。手動で移動時間を入力してください。",
        );
        return;
      }

      setRouteOptions(routes);
      setSelectedRouteIndex(0);
      const selectedRoute = routes[0];
      setTravelTimeValue(Math.floor(selectedRoute.duration / 60));

      Alert.alert(
        "計算完了",
        `${routes.length}件のルートが見つかりました。\n最適なルートを選択してください。`,
      );
    } catch (error) {
      console.error("ルート計算エラー:", error);
      Alert.alert(
        "エラー",
        "ルートの計算に失敗しました。手動で移動時間を入力してください。",
      );
    } finally {
      setCalculating(false);
    }
  };

  const selectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    const selectedRoute = routeOptions[index];
    setTravelTimeValue(Math.floor(selectedRoute.duration / 60));
  };

  const getModeText = (mode: string): string => {
    switch (mode) {
      case "walking":
        return "徒歩";
      case "transit":
        return "電車";
      case "driving":
        return "車";
      default:
        return mode;
    }
  };

  const getModeIcon = (mode: string): string => {
    switch (mode) {
      case "walking":
        return "🚶";
      case "transit":
        return "🚆";
      case "driving":
        return "🚗";
      default:
        return "📍";
    }
  };

  // 予定を保存
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("エラー", "予定のタイトルを入力してください");
      return;
    }

    if (!isAllDay && endTime <= startTime) {
      Alert.alert("エラー", "終了時間は開始時間より後にしてください");
      return;
    }

    try {
      let notificationIds: any = undefined;
      let notificationTime: Date | null = null;
      let weatherInfo: weatherService.WeatherData | undefined = undefined;
      let adjustedMinutesBefore = notificationMinutesBefore;
      let weatherMessage = "";

      if (notification && notificationMinutesBefore > 0) {
        if (
          location.trim() &&
          routeOptions.length > 0 &&
          selectedRouteIndex !== null
        ) {
          try {
            const weatherSettings =
              await storageService.getWeatherNotificationSettings();
            if (weatherSettings.enabled) {
              const selectedRoute = routeOptions[selectedRouteIndex];
              if (selectedRoute.endLocation) {
                console.log("🌤️ 目的地の天気情報を取得中...");
                weatherInfo = await weatherService.getWeatherByCoords(
                  selectedRoute.endLocation,
                );

                let extraMinutes = 0;
                if (weatherInfo.main === "Rain")
                  extraMinutes = weatherSettings.rainMinutes;
                else if (weatherInfo.main === "Snow")
                  extraMinutes = weatherSettings.snowMinutes;
                else if (weatherInfo.main === "Thunderstorm")
                  extraMinutes = weatherSettings.thunderstormMinutes;
                else if (weatherInfo.main === "Clouds")
                  extraMinutes = weatherSettings.cloudyMinutes;

                if (extraMinutes > 0) {
                  adjustedMinutesBefore =
                    notificationMinutesBefore + extraMinutes;
                  weatherMessage = `${weatherInfo.emoji} 天気: ${weatherInfo.description}（${extraMinutes}分早めに通知）`;
                  console.log(
                    `⚠️ 天気により通知を${extraMinutes}分早めました（${notificationMinutesBefore}分 → ${adjustedMinutesBefore}分）`,
                  );
                } else {
                  weatherMessage = `${weatherInfo.emoji} 天気: ${weatherInfo.description}`;
                }
              }
            }
          } catch (weatherError) {
            console.warn("天気情報の取得に失敗しました:", weatherError);
          }
        }

        notificationTime = new Date(
          startTime.getTime() - adjustedMinutesBefore * 60 * 1000,
        );
        const now = new Date();
        const secondsUntilNotification = Math.floor(
          (notificationTime.getTime() - now.getTime()) / 1000,
        );

        console.log("=== 通知スケジュール情報 ===");
        console.log("現在時刻:", now.toLocaleString("ja-JP"));
        console.log("予定開始時刻:", startTime.toLocaleString("ja-JP"));
        console.log("通知時刻:", notificationTime.toLocaleString("ja-JP"));
        console.log("通知までの秒数:", secondsUntilNotification, "秒");

        if (secondsUntilNotification > 60) {
          try {
            const notifId =
              await notificationService.schedulePreparationNotification(
                notificationTime,
                location.trim() || title,
                adjustedMinutesBefore,
                weatherMessage || undefined,
              );
            notificationIds = { departure: notifId, preparation: notifId };
            console.log("✅ 通知をスケジュールしました。ID:", notifId);
          } catch (error) {
            console.error("❌ 通知スケジュールエラー:", error);
            Alert.alert(
              "通知エラー",
              "通知のスケジュールに失敗しました。通知権限を確認してください。",
            );
          }
        } else {
          const minutesUntil = Math.floor(secondsUntilNotification / 60);
          Alert.alert(
            "通知について",
            `通知時刻が${minutesUntil > 0 ? "近すぎる" : "過去"}ため、通知はスケジュールされませんでした。\n\n` +
              `現在時刻: ${now.toLocaleTimeString("ja-JP")}\n` +
              `予定開始: ${startTime.toLocaleTimeString("ja-JP")}\n` +
              `通知予定: ${notificationTime.toLocaleTimeString("ja-JP")}\n\n` +
              "通知は予定開始の少なくとも1分以上前に設定してください。",
          );
        }
      }

      const eventData: EventData = {
        id: editingEvent?.id || Date.now().toString(),
        title,
        location: location.trim() || undefined,
        startTime,
        endTime,
        travelTime: travelTimeValue > 0 ? travelTimeValue : undefined,
        repeat,
        notification: notification && notificationMinutesBefore > 0,
        notificationMinutesBefore:
          notification && notificationMinutesBefore > 0
            ? notificationMinutesBefore
            : undefined,
        notificationIds,
        memo: memo.trim() || undefined,
        isAllDay,
      };

      onSave(eventData);
      resetForm();

      let successMessage = editingEvent
        ? "✅ 予定を更新しました"
        : "✅ 予定を作成しました";
      if (notification && notificationIds && notificationTime) {
        const notificationDate = notificationTime.toLocaleDateString("ja-JP", {
          month: "2-digit",
          day: "2-digit",
        });
        const notificationTimeStr = notificationTime.toLocaleTimeString(
          "ja-JP",
          { hour: "2-digit", minute: "2-digit" },
        );
        successMessage += `\n\n📲 通知予定:\n${notificationDate} ${notificationTimeStr}`;
        if (adjustedMinutesBefore !== notificationMinutesBefore) {
          successMessage += `\n（${adjustedMinutesBefore}分前）`;
          successMessage += `\n${weatherMessage}`;
        } else {
          successMessage += `\n（${notificationMinutesBefore}分前）`;
          if (weatherMessage) successMessage += `\n${weatherMessage}`;
        }
        successMessage += `\n\n※これはダイアログです。実際の通知は予定時刻に届きます。`;
      } else if (
        notification &&
        notificationMinutesBefore > 0 &&
        !notificationIds
      ) {
        successMessage +=
          "\n\n⚠️ 通知時刻が過去のため、通知はスケジュールされませんでした。";
      }
      Alert.alert(editingEvent ? "📝 予定更新" : "📝 予定作成", successMessage);
    } catch (error) {
      console.error("予定保存エラー:", error);
      Alert.alert("エラー", "予定の保存に失敗しました");
    }
  };

  const resetForm = () => {
    setTitle("");
    setLocation("");
    setMemo("");
    setIsAllDay(false);
    setTravelTimeValue(0);
    setRepeat("none");
    setNotification(true);
    setNotificationMinutesBefore(15);
    setRouteOptions([]);
    setSelectedRouteIndex(null);
    setCoordinates(undefined);
    onClose();
  };

  // 日付フォーマット
  const formatDate = (date: Date) =>
    date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  // 移動時間ラベル取得
  const getTravelTimeLabel = () => {
    const opt = TRAVEL_TIME_OPTIONS.find((o) => o.value === travelTimeValue);
    return opt ? opt.label : `${travelTimeValue}分`;
  };

  // 繰り返しラベル取得
  const getRepeatLabel = () => {
    const opt = REPEAT_OPTIONS.find((o) => o.value === repeat);
    return opt ? opt.label : "しない";
  };

  // 通知ラベル取得
  const getNotificationLabel = () => {
    if (!notification || notificationMinutesBefore === 0) return "なし";
    const opt = NOTIFICATION_OPTIONS.find(
      (o) => o.value === notificationMinutesBefore,
    );
    return opt ? opt.label : `${notificationMinutesBefore}分前`;
  };

  // セパレータコンポーネント
  const Separator = () => (
    <View style={[styles.separator, { backgroundColor: separatorColor }]} />
  );

  // セクション行コンポーネント（タップでドロップダウン）
  const SectionRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.sectionRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color: secondaryText }]}>{value}</Text>
        {onPress && (
          <Text style={[styles.chevron, { color: secondaryText }]}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetForm}
    >
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: iconBg }]}
            onPress={resetForm}
          >
            <Text style={[styles.headerIconText, { color: textColor }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {editingEvent ? "予定を編集" : "新規"}
          </Text>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: iconBg }]}
            onPress={handleSave}
          >
            <Text style={[styles.headerIconText, { color: textColor }]}>✓</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* セクション1: タイトル + 場所 */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <TextInput
              style={[styles.cardInput, { color: textColor }]}
              placeholder="タイトル"
              placeholderTextColor={secondaryText}
              value={title}
              onChangeText={setTitle}
            />
            <Separator />
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.cardInput, styles.locationInput, { color: textColor }]}
                placeholder="場所または移動時間"
                placeholderTextColor={secondaryText}
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity
                style={[styles.mapButton, { backgroundColor: dateButtonBg }]}
                onPress={() => setShowMapPicker(true)}
              >
                <Text style={styles.mapButtonIcon}>📍</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ルート自動計算（場所入力時のみ表示） */}
          {location.trim() !== "" && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <TouchableOpacity
                style={[
                  styles.calculateButton,
                  calculating && styles.buttonDisabled,
                ]}
                onPress={calculateRoute}
                disabled={calculating}
              >
                {calculating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.calculateButtonText}>
                    📍 移動時間を自動計算
                  </Text>
                )}
              </TouchableOpacity>

              {/* ルートオプション表示 */}
              {routeOptions.length > 0 && (
                <View style={styles.routeOptionsContainer}>
                  {routeOptions.map((route, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.routeOptionCard,
                        { borderColor: separatorColor },
                        selectedRouteIndex === index &&
                          styles.routeOptionSelected,
                      ]}
                      onPress={() => selectRoute(index)}
                    >
                      <View style={styles.routeOptionHeader}>
                        <Text style={styles.routeOptionIcon}>
                          {getModeIcon(route.mode)}
                        </Text>
                        <Text
                          style={[
                            styles.routeOptionMode,
                            {
                              color:
                                selectedRouteIndex === index
                                  ? "#fff"
                                  : textColor,
                            },
                          ]}
                        >
                          {getModeText(route.mode)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.routeOptionDuration,
                          {
                            color:
                              selectedRouteIndex === index ? "#fff" : textColor,
                          },
                        ]}
                      >
                        所要時間: {route.durationText}
                      </Text>
                      {route.distance > 0 && (
                        <Text
                          style={[
                            styles.routeOptionDistance,
                            {
                              color:
                                selectedRouteIndex === index
                                  ? "#fff"
                                  : textColor,
                            },
                          ]}
                        >
                          距離: {route.distanceText}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* セクション2: 日時設定 */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {/* 終日トグル */}
            <View style={styles.sectionRow}>
              <Text style={[styles.rowLabel, { color: textColor }]}>終日</Text>
              <Switch
                value={isAllDay}
                onValueChange={setIsAllDay}
                trackColor={{ false: "#767577", true: "#34C759" }}
                thumbColor={"#fff"}
              />
            </View>
            <Separator />

            {/* 開始 */}
            <View style={styles.dateTimeRow}>
              <Text style={[styles.rowLabel, { color: textColor }]}>開始</Text>
              <View style={styles.dateTimeButtons}>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: dateButtonBg }]}
                  onPress={() => {
                    setShowStartPicker(!showStartPicker);
                    setShowEndPicker(false);
                  }}
                >
                  <Text style={[styles.dateButtonText, { color: textColor }]}>
                    {formatDate(startTime)}
                  </Text>
                </TouchableOpacity>
                {!isAllDay && (
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      { backgroundColor: dateButtonBg },
                    ]}
                    onPress={() => {
                      setShowStartPicker(!showStartPicker);
                      setShowEndPicker(false);
                    }}
                  >
                    <Text style={[styles.dateButtonText, { color: textColor }]}>
                      {formatTime(startTime)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 開始ピッカー */}
            {showStartPicker && (
              <View
                style={[
                  styles.inlinePickerContainer,
                  { backgroundColor: screenBg },
                ]}
              >
                <DateTimePicker
                  value={startTime}
                  mode={isAllDay ? "date" : "datetime"}
                  display="inline"
                  locale="ja-JP"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setStartTime(selectedDate);
                      // 終了時刻を自動調整
                      if (selectedDate >= endTime) {
                        const newEnd = new Date(selectedDate);
                        newEnd.setHours(newEnd.getHours() + 1);
                        setEndTime(newEnd);
                      }
                    }
                  }}
                  themeVariant={theme}
                />
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowStartPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>完了</Text>
                </TouchableOpacity>
              </View>
            )}

            <Separator />

            {/* 終了 */}
            <View style={styles.dateTimeRow}>
              <Text style={[styles.rowLabel, { color: textColor }]}>終了</Text>
              <View style={styles.dateTimeButtons}>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: dateButtonBg }]}
                  onPress={() => {
                    setShowEndPicker(!showEndPicker);
                    setShowStartPicker(false);
                  }}
                >
                  <Text style={[styles.dateButtonText, { color: textColor }]}>
                    {formatDate(endTime)}
                  </Text>
                </TouchableOpacity>
                {!isAllDay && (
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      { backgroundColor: dateButtonBg },
                    ]}
                    onPress={() => {
                      setShowEndPicker(!showEndPicker);
                      setShowStartPicker(false);
                    }}
                  >
                    <Text style={[styles.dateButtonText, { color: textColor }]}>
                      {formatTime(endTime)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 終了ピッカー */}
            {showEndPicker && (
              <View
                style={[
                  styles.inlinePickerContainer,
                  { backgroundColor: screenBg },
                ]}
              >
                <DateTimePicker
                  value={endTime}
                  mode={isAllDay ? "date" : "datetime"}
                  display="inline"
                  locale="ja-JP"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setEndTime(selectedDate);
                    }
                  }}
                  themeVariant={theme}
                />
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => setShowEndPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>完了</Text>
                </TouchableOpacity>
              </View>
            )}

            <Separator />

            {/* 移動時間 */}
            <SectionRow
              label="移動時間"
              value={getTravelTimeLabel()}
              onPress={() => {
                setShowTravelTimePicker(!showTravelTimePicker);
                setShowRepeatPicker(false);
                setShowNotificationPicker(false);
              }}
            />

            {/* 移動時間ピッカー */}
            {showTravelTimePicker && (
              <View style={styles.pickerOptions}>
                {TRAVEL_TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.pickerOption,
                      {
                        backgroundColor:
                          travelTimeValue === opt.value
                            ? accentColor
                            : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setTravelTimeValue(opt.value);
                      setShowTravelTimePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        {
                          color:
                            travelTimeValue === opt.value ? "#fff" : textColor,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* セクション3: 繰り返し */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <SectionRow
              label="繰り返し"
              value={getRepeatLabel()}
              onPress={() => {
                setShowRepeatPicker(!showRepeatPicker);
                setShowTravelTimePicker(false);
                setShowNotificationPicker(false);
              }}
            />
            {showRepeatPicker && (
              <View style={styles.pickerOptions}>
                {REPEAT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.pickerOption,
                      {
                        backgroundColor:
                          repeat === opt.value ? accentColor : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setRepeat(opt.value);
                      setShowRepeatPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        { color: repeat === opt.value ? "#fff" : textColor },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* セクション4: メモ */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <TextInput
              style={[styles.memoInput, { color: textColor }]}
              placeholder="メモ"
              placeholderTextColor={secondaryText}
              value={memo}
              onChangeText={setMemo}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* セクション5: 通知 */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <SectionRow
              label="通知"
              value={getNotificationLabel()}
              onPress={() => {
                setShowNotificationPicker(!showNotificationPicker);
                setShowTravelTimePicker(false);
                setShowRepeatPicker(false);
              }}
            />
            {showNotificationPicker && (
              <View style={styles.pickerOptions}>
                {NOTIFICATION_OPTIONS.map((opt) => {
                  const isSelected =
                    (opt.value === 0 &&
                      (!notification || notificationMinutesBefore === 0)) ||
                    (opt.value > 0 &&
                      notification &&
                      notificationMinutesBefore === opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.pickerOption,
                        {
                          backgroundColor: isSelected
                            ? accentColor
                            : "transparent",
                        },
                      ]}
                      onPress={() => {
                        if (opt.value === 0) {
                          setNotification(false);
                          setNotificationMinutesBefore(0);
                        } else {
                          setNotification(true);
                          setNotificationMinutesBefore(opt.value);
                        }
                        setShowNotificationPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          { color: isSelected ? "#fff" : textColor },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* 下部余白 */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* マップピッカーモーダル */}
      <MapPickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelect={(addr, coords) => {
          setLocation(addr);
          setCoordinates(coords);
        }}
        initialLocation={location}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 16 : 12,
    paddingBottom: 12,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconText: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 44,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowValue: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
    marginLeft: 6,
    fontWeight: "300",
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 44,
  },
  dateTimeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dateButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  inlinePickerContainer: {
    alignItems: "center",
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 8,
    padding: 8,
  },
  pickerDoneButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  pickerDoneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  memoInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  calculateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calculateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  routeOptionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  routeOptionCard: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "transparent",
  },
  routeOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  routeOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  routeOptionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  routeOptionMode: {
    fontSize: 16,
    fontWeight: "bold",
  },
  routeOptionDuration: {
    fontSize: 14,
    marginLeft: 32,
  },
  routeOptionDistance: {
    fontSize: 13,
    marginLeft: 32,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationInput: {
    flex: 1,
  },
  mapButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  mapButtonIcon: {
    fontSize: 18,
  },
});
