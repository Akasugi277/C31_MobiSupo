// AddEventModal.tsx
// 新規予定作成モーダル

import React, { useState, useContext } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemeContext } from "./ThemeContext";
import * as weatherService from "../services/weatherService";
import * as routeService from "../services/routeService";
import * as notificationService from "../services/notificationService";

interface AddEventModalProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD形式
  onClose: () => void;
  onSave: (event: EventData) => void;
}

export interface EventData {
  id: string;
  title: string;
  location?: string; // 場所（任意）
  startTime: Date; // 開始時間
  endTime: Date; // 終了時間
  travelTime?: number; // 移動時間（分）任意
  repeat?: "none" | "daily" | "weekly" | "monthly"; // 繰り返し
  notification: boolean; // 通知のあり/なし
  travelMode?: "walking" | "transit" | "driving";
  weather?: string;
  notificationIds?: {
    departure: string;
    preparation: string;
  };
}

export default function AddEventModal({
  visible,
  selectedDate,
  onClose,
  onSave,
}: AddEventModalProps) {
  const { theme } = useContext(ThemeContext);
  const bgColor = theme === "light" ? "#fff" : "#333";
  const textColor = theme === "light" ? "#000" : "#fff";

  // フォーム入力状態
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(() => {
    // 選択された日付の10:00をデフォルトに設定
    const date = new Date(selectedDate);
    date.setHours(10, 0, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState(() => {
    // 選択された日付の11:00をデフォルトに設定
    const date = new Date(selectedDate);
    date.setHours(11, 0, 0, 0);
    return date;
  });
  const [travelTime, setTravelTime] = useState("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [notification, setNotification] = useState(true);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // ルート計算の状態
  const [calculating, setCalculating] = useState(false);
  const [routeOptions, setRouteOptions] = useState<routeService.RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);

  // 複数のルートを計算して表示
  const calculateRoute = async () => {
    if (!location.trim()) {
      Alert.alert("エラー", "場所を入力してください");
      return;
    }

    setCalculating(true);
    try {
      // 現在地を取得
      const currentLocation = await routeService.getCurrentLocation();

      // 目的地の座標を取得（Google Geocoding API）
      const destinationCoords = await routeService.geocodeAddress(location);

      // 複数のルートを並行検索（徒歩、車、公共交通機関）
      const routes = await routeService.searchMultipleRoutes(
        currentLocation,
        destinationCoords,
        startTime
      );

      if (routes.length === 0) {
        Alert.alert("エラー", "ルートが見つかりませんでした。手動で移動時間を入力してください。");
        return;
      }

      setRouteOptions(routes);

      // デフォルトで最初のルートを選択
      setSelectedRouteIndex(0);
      const selectedRoute = routes[0];
      setTravelTime(Math.floor(selectedRoute.duration / 60).toString());

      Alert.alert(
        "計算完了",
        `${routes.length}件のルートが見つかりました。\n最適なルートを選択してください。`
      );
    } catch (error) {
      console.error("ルート計算エラー:", error);
      Alert.alert("エラー", "ルートの計算に失敗しました。手動で移動時間を入力してください。");
    } finally {
      setCalculating(false);
    }
  };

  // ルートを選択
  const selectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    const selectedRoute = routeOptions[index];
    setTravelTime(Math.floor(selectedRoute.duration / 60).toString());
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

    // 終了時間が開始時間より前の場合はエラー
    if (endTime <= startTime) {
      Alert.alert("エラー", "終了時間は開始時間より後にしてください");
      return;
    }

    try {
      let notificationIds: any = undefined;

      // 通知が有効な場合、開始時刻の通知をスケジュール
      if (notification) {
        const notifId = await notificationService.scheduleDepartureNotification(
          startTime,
          location.trim() || title,
          "予定時刻"
        );

        notificationIds = {
          departure: notifId,
          preparation: notifId,
        };
      }

      // イベントデータを作成
      const eventData: EventData = {
        id: Date.now().toString(),
        title,
        location: location.trim() || undefined,
        startTime,
        endTime,
        travelTime: travelTime.trim() ? parseInt(travelTime) : undefined,
        repeat,
        notification,
        notificationIds,
      };

      onSave(eventData);
      resetForm();

      Alert.alert("成功", "予定を作成しました");
    } catch (error) {
      console.error("予定保存エラー:", error);
      Alert.alert("エラー", "予定の保存に失敗しました");
    }
  };

  const resetForm = () => {
    setTitle("");
    setLocation("");
    setTravelTime("");
    setRepeat("none");
    setNotification(true);
    setRouteOptions([]);
    setSelectedRouteIndex(null);
    onClose();
  };

  const getRepeatText = (repeat: string): string => {
    switch (repeat) {
      case "none":
        return "繰り返しなし";
      case "daily":
        return "毎日";
      case "weekly":
        return "毎週";
      case "monthly":
        return "毎月";
      default:
        return repeat;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
          <ScrollView>
            <Text style={[styles.modalTitle, { color: textColor }]}>新規予定作成</Text>

            {/* タイトル入力 */}
            <Text style={[styles.label, { color: textColor }]}>タイトル *</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="例: 会議"
              placeholderTextColor={textColor + "80"}
              value={title}
              onChangeText={setTitle}
            />

            {/* 場所入力（任意） */}
            <Text style={[styles.label, { color: textColor }]}>場所（任意）</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="例: 会議室A"
              placeholderTextColor={textColor + "80"}
              value={location}
              onChangeText={setLocation}
            />

            {/* 開始時間選択 */}
            <Text style={[styles.label, { color: textColor }]}>開始時間 *</Text>
            <TouchableOpacity
              style={[styles.timeButton, { borderColor: textColor }]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={{ color: textColor }}>
                {startTime.toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>

            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartTimePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setStartTime(selectedDate);
                  }
                }}
              />
            )}

            {/* 終了時間選択 */}
            <Text style={[styles.label, { color: textColor }]}>終了時間 *</Text>
            <TouchableOpacity
              style={[styles.timeButton, { borderColor: textColor }]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={{ color: textColor }}>
                {endTime.toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>

            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndTimePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setEndTime(selectedDate);
                  }
                }}
              />
            )}

            {/* 移動時間入力（任意） */}
            <Text style={[styles.label, { color: textColor }]}>移動時間（任意）</Text>
            <View style={styles.travelTimeContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.travelTimeInput,
                  { color: textColor, borderColor: textColor },
                ]}
                placeholder="例: 30（分）"
                placeholderTextColor={textColor + "80"}
                value={travelTime}
                onChangeText={setTravelTime}
                keyboardType="numeric"
              />
              {location.trim() && (
                <TouchableOpacity
                  style={[styles.calculateButton, calculating && styles.buttonDisabled]}
                  onPress={calculateRoute}
                  disabled={calculating}
                >
                  {calculating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.calculateButtonText}>自動計算</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ルートオプション表示 */}
            {routeOptions.length > 0 && (
              <View style={styles.routeOptionsContainer}>
                <Text style={[styles.routeOptionsTitle, { color: textColor }]}>
                  ルートを選択
                </Text>
                {routeOptions.map((route, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.routeOptionCard,
                      { borderColor: textColor },
                      selectedRouteIndex === index && styles.routeOptionSelected,
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
                              selectedRouteIndex === index ? "#fff" : textColor,
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
                          color: selectedRouteIndex === index ? "#fff" : textColor,
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
                              selectedRouteIndex === index ? "#fff" : textColor,
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

            {/* 繰り返し選択 */}
            <Text style={[styles.label, { color: textColor }]}>繰り返し</Text>
            <View style={styles.repeatContainer}>
              {(["none", "daily", "weekly", "monthly"] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.repeatButton,
                    { borderColor: textColor },
                    repeat === option && { backgroundColor: "#007AFF" },
                  ]}
                  onPress={() => setRepeat(option)}
                >
                  <Text
                    style={{
                      color: repeat === option ? "#fff" : textColor,
                      fontSize: 14,
                    }}
                  >
                    {getRepeatText(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 通知のあり/なし */}
            <Text style={[styles.label, { color: textColor }]}>通知</Text>
            <View style={styles.notificationContainer}>
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  { borderColor: textColor },
                  notification && { backgroundColor: "#34C759" },
                ]}
                onPress={() => setNotification(true)}
              >
                <Text
                  style={{
                    color: notification ? "#fff" : textColor,
                    fontSize: 14,
                  }}
                >
                  あり
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  { borderColor: textColor },
                  !notification && { backgroundColor: "#FF3B30" },
                ]}
                onPress={() => setNotification(false)}
              >
                <Text
                  style={{
                    color: !notification ? "#fff" : textColor,
                    fontSize: 14,
                  }}
                >
                  なし
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.buttonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  travelTimeContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  travelTimeInput: {
    flex: 1,
  },
  calculateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  calculateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  routeInfoText: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  routeOptionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  routeOptionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
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
  repeatContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  repeatButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: "center",
  },
  notificationContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  notificationButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
