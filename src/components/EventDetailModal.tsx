// EventDetailModal.tsx
// 予定詳細表示モーダル（iOS風デザイン）

import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeContext } from "./ThemeContext";
import { EventData } from "./AddEventModal";
import RouteMapModal from "./RouteMapModal";
import * as notificationService from "../services/notificationService";
import * as routeService from "../services/routeService";

interface EventDetailModalProps {
  visible: boolean;
  event: EventData | null;
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onEdit?: (event: EventData) => void;
}

export default function EventDetailModal({
  visible,
  event,
  onClose,
  onDelete,
  onEdit,
}: EventDetailModalProps) {
  const { theme } = useContext(ThemeContext);

  const screenBg = theme === "light" ? "#f2f2f7" : "#1c1c1e";
  const cardBg = theme === "light" ? "#fff" : "#2c2c2e";
  const textColor = theme === "light" ? "#000" : "#fff";
  const secondaryText = "#8e8e93";
  const separatorColor = theme === "light" ? "#c6c6c8" : "#38383a";
  const headerBg = theme === "light" ? "#f2f2f7" : "#1c1c1e";
  const iconBg = theme === "light" ? "#e5e5ea" : "#3a3a3c";

  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<number>(0);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [calculatedRoutes, setCalculatedRoutes] = useState<routeService.RouteInfo[]>([]);

  if (!event) return null;

  const handleDelete = async () => {
    Alert.alert(
      "予定を削除",
      "この予定を削除しますか？\n関連する通知も削除されます。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            if (event.notificationIds) {
              try {
                if (event.notificationIds.departure) {
                  await notificationService.cancelNotification(event.notificationIds.departure);
                }
                if (event.notificationIds.preparation) {
                  await notificationService.cancelNotification(event.notificationIds.preparation);
                }
              } catch (error) {
                console.error("通知キャンセルエラー:", error);
              }
            }
            onDelete(event.id);
            onClose();
          },
        },
      ],
    );
  };

  const getModeText = (mode: string): string => {
    switch (mode) {
      case "walking": return "徒歩";
      case "transit": return "電車";
      case "driving": return "車";
      default: return mode;
    }
  };

  const getModeIcon = (mode: string): string => {
    switch (mode) {
      case "walking": return "🚶";
      case "transit": return "🚆";
      case "driving": return "🚗";
      default: return "📍";
    }
  };

  const handleEdit = () => {
    if (event && onEdit) {
      onEdit(event);
      onClose();
    }
  };

  const getRepeatText = (repeat: string): string => {
    switch (repeat) {
      case "none": return "なし";
      case "daily": return "毎日";
      case "weekly": return "毎週";
      case "monthly": return "毎月";
      default: return repeat;
    }
  };

  // ルートを計算して表示
  const handleCalculateRoute = async () => {
    if (!event.location) return;
    setCalculatingRoute(true);
    try {
      const currentLocation = await routeService.getCurrentLocation();
      const destinationCoords = await routeService.geocodeAddress(event.location);
      const routes = await routeService.searchMultipleRoutes(
        currentLocation,
        destinationCoords,
        event.startTime,
      );
      if (routes.length === 0) {
        Alert.alert("エラー", "ルートが見つかりませんでした");
        return;
      }
      setCalculatedRoutes(routes);
      setSelectedRouteForMap(0);
      setShowMapModal(true);
    } catch (error) {
      console.error("ルート計算エラー:", error);
      Alert.alert("エラー", "ルートの計算に失敗しました");
    } finally {
      setCalculatingRoute(false);
    }
  };

  // 表示用のルート配列（保存済み or 動的計算済み）
  const displayRoutes = event.routes && event.routes.length > 0 ? event.routes : calculatedRoutes;

  const formatDateTime = (date: Date) =>
    date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const Separator = () => (
    <View style={[styles.separator, { backgroundColor: separatorColor }]} />
  );

  // ルートを確認できるか（保存済みルート or 場所＋移動時間あり）
  const canShowRoute =
    (event.routes && event.routes.length > 0) ||
    (event.location && event.travelTime && event.travelTime > 0);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: screenBg }]}>
          {/* ヘッダー */}
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: iconBg }]}
              onPress={onClose}
            >
              <Text style={[styles.headerIconText, { color: textColor }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              予定詳細
            </Text>
            <View style={styles.headerIconButton} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* タイトルカード */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.eventTitle, { color: textColor }]}>
                {event.title}
              </Text>
              {event.isAllDay && (
                <View style={styles.allDayBadge}>
                  <Text style={styles.allDayBadgeText}>終日</Text>
                </View>
              )}
            </View>

            {/* 日時カード */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailIcon]}>🕐</Text>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: secondaryText }]}>
                    開始
                  </Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {formatDateTime(event.startTime)}
                  </Text>
                </View>
              </View>
              <Separator />
              <View style={styles.detailRow}>
                <Text style={[styles.detailIcon]}>🕐</Text>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: secondaryText }]}>
                    終了
                  </Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {formatDateTime(event.endTime)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 場所・移動時間カード */}
            {(event.location || (event.travelTime && event.travelTime > 0)) && (
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                {event.location && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: secondaryText }]}>
                          場所
                        </Text>
                        <Text style={[styles.detailValue, { color: textColor }]}>
                          {event.location}
                        </Text>
                      </View>
                    </View>
                    {event.travelTime && event.travelTime > 0 && <Separator />}
                  </>
                )}
                {event.travelTime && event.travelTime > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>
                      {event.travelMode === "transit" ? "🚆" : event.travelMode === "driving" ? "🚗" : "🚶"}
                    </Text>
                    <View style={styles.detailContent}>
                      <Text style={[styles.detailLabel, { color: secondaryText }]}>
                        移動時間（{event.travelMode === "transit" ? "電車" : event.travelMode === "driving" ? "車" : "徒歩"}）
                      </Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>
                        {event.travelTime >= 60
                          ? `${Math.floor(event.travelTime / 60)}時間${event.travelTime % 60 > 0 ? `${event.travelTime % 60}分` : ""}`
                          : `${event.travelTime}分`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ルート確認ボタン */}
            {canShowRoute && (
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                {/* 保存済みルートがある場合 */}
                {event.routes && event.routes.length > 0 ? (
                  <>
                    <Text style={[styles.sectionLabel, { color: secondaryText }]}>
                      ルート情報（{event.routes.length}件）
                    </Text>
                    {event.routes.map((route, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.routeCard,
                          { borderColor: separatorColor },
                          event.selectedRouteIndex === index && styles.routeCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedRouteForMap(index);
                          setShowMapModal(true);
                        }}
                      >
                        <View style={styles.routeHeader}>
                          <Text style={styles.routeIcon}>{getModeIcon(route.mode)}</Text>
                          <Text style={[styles.routeMode, { color: textColor }]}>
                            {getModeText(route.mode)}
                          </Text>
                          {event.selectedRouteIndex === index && (
                            <View style={styles.selectedBadge}>
                              <Text style={styles.selectedBadgeText}>選択中</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.routeDuration, { color: textColor }]}>
                          所要時間: {route.durationText}
                        </Text>
                        {route.distance > 0 && (
                          <Text style={[styles.routeDistance, { color: secondaryText }]}>
                            距離: {route.distanceText}
                          </Text>
                        )}
                        <Text style={[styles.routeMapLink, { color: "#007AFF" }]}>
                          📍 マップで表示
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  /* 保存済みルートはないが場所＋移動時間がある場合 */
                  <TouchableOpacity
                    style={[styles.routeButton, calculatingRoute && { opacity: 0.5 }]}
                    onPress={handleCalculateRoute}
                    disabled={calculatingRoute}
                  >
                    {calculatingRoute ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.routeButtonText}>
                        📍 ルートを確認
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 繰り返し・通知カード */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🔄</Text>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: secondaryText }]}>
                    繰り返し
                  </Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {getRepeatText(event.repeat || "none")}
                  </Text>
                </View>
              </View>
              <Separator />
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>
                  {event.notification ? "🔔" : "🔕"}
                </Text>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: secondaryText }]}>
                    通知
                  </Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {event.notification && event.notificationMinutesBefore
                      ? event.notificationMinutesBefore >= 60
                        ? `${event.notificationMinutesBefore / 60}時間前`
                        : `${event.notificationMinutesBefore}分前`
                      : "なし"}
                  </Text>
                </View>
              </View>
            </View>

            {/* メモカード */}
            {event.memo && (
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📝</Text>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: secondaryText }]}>
                      メモ
                    </Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>
                      {event.memo}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* アクションボタン */}
            <View style={styles.actionButtons}>
              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#007AFF" }]}
                  onPress={handleEdit}
                >
                  <Text style={styles.actionButtonText}>編集</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#FF3B30" }]}
                onPress={handleDelete}
              >
                <Text style={styles.actionButtonText}>削除</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>

      {/* ルートマップモーダル */}
      {displayRoutes.length > 0 && displayRoutes[selectedRouteForMap] && (
        <RouteMapModal
          visible={showMapModal}
          route={displayRoutes[selectedRouteForMap]}
          startLocation={displayRoutes[selectedRouteForMap].startLocation}
          endLocation={displayRoutes[selectedRouteForMap].endLocation}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    height: "85%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
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
    paddingTop: 8,
  },
  card: {
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  allDayBadge: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 16,
    marginBottom: 12,
  },
  allDayBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailIcon: {
    fontSize: 18,
    width: 28,
    marginTop: 1,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  routeCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  routeCardSelected: {
    backgroundColor: "#007AFF20",
    borderColor: "#007AFF",
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  routeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  routeMode: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  routeDuration: {
    fontSize: 14,
    marginLeft: 28,
    marginBottom: 2,
  },
  routeDistance: {
    fontSize: 13,
    marginLeft: 28,
    marginBottom: 4,
  },
  routeMapLink: {
    fontSize: 14,
    marginLeft: 28,
    marginTop: 4,
    fontWeight: "600",
  },
  routeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  routeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
