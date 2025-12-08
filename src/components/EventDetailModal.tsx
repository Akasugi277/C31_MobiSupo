// EventDetailModal.tsx
// 予定詳細表示モーダル

import React, { useContext, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ThemeContext } from "./ThemeContext";
import { EventData } from "./AddEventModal";
import RouteMapModal from "./RouteMapModal";

interface EventDetailModalProps {
  visible: boolean;
  event: EventData | null;
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onEdit?: (event: EventData) => void; // 追加
}

export default function EventDetailModal({
  visible,
  event,
  onClose,
  onDelete,
  onEdit,
}: EventDetailModalProps) {
  const { theme } = useContext(ThemeContext);
  const bgColor = theme === "light" ? "#fff" : "#333";
  const textColor = theme === "light" ? "#000" : "#fff";

  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<number>(0);

  if (!event) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
      onClose();
    }
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

  const handleEdit = () => {
    if (event && onEdit) {
      onEdit(event);
      onClose();
    }
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
          <ScrollView>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              予定詳細
            </Text>

            {/* タイトル */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                タイトル
              </Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {event.title}
              </Text>
            </View>

            {/* 場所 */}
            {event.location && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                  場所
                </Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  📍 {event.location}
                </Text>
              </View>
            )}

            {/* 開始時間 */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                開始日時
              </Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {event.startTime.toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {/* 終了時間 */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                終了日時
              </Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {event.endTime.toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {/* 移動時間 */}
            {event.travelTime && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                  移動時間
                </Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  🚶 {event.travelTime}分
                </Text>
              </View>
            )}

            {/* 繰り返し */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                繰り返し
              </Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {getRepeatText(event.repeat || "none")}
              </Text>
            </View>

            {/* 通知 */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                通知
              </Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {event.notification ? "🔔 あり" : "🔕 なし"}
              </Text>
              {event.notification && event.notificationMinutesBefore && (
                <Text style={[styles.detailValue, { color: textColor, fontSize: 14, marginTop: 4, marginLeft: 4 }]}>
                  {event.notificationMinutesBefore >= 60
                    ? `${event.notificationMinutesBefore / 60}時間前に通知`
                    : `${event.notificationMinutesBefore}分前に通知`}
                </Text>
              )}
            </View>

            {/* ルート情報 */}
            {event.routes && event.routes.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: textColor + "80" }]}>
                  ルート情報（{event.routes.length}件）
                </Text>
                {event.routes.map((route, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.routeCard,
                      { borderColor: textColor + "40" },
                      event.selectedRouteIndex === index && styles.routeCardSelected,
                    ]}
                    onPress={() => {
                      console.log("ルートカードをタップ:", index);
                      console.log("ルートデータ:", route);
                      console.log("座標情報:", {
                        start: route.startLocation,
                        end: route.endLocation
                      });
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
                      <Text style={[styles.routeDistance, { color: textColor + "80" }]}>
                        距離: {route.distanceText}
                      </Text>
                    )}
                    <Text style={[styles.routeMapLink, { color: "#007AFF" }]}>
                      📍 マップで表示
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            {onEdit && (
              <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
                <Text style={styles.buttonText}>編集</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.buttonText}>削除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ルートマップモーダル */}
      {event.routes && event.routes[selectedRouteForMap] && (
        <RouteMapModal
          visible={showMapModal}
          route={event.routes[selectedRouteForMap]}
          startLocation={event.routes[selectedRouteForMap].startLocation}
          endLocation={event.routes[selectedRouteForMap].endLocation}
          onClose={() => setShowMapModal(false)}
        />
      )}
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
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "400",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  routeCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: "transparent",
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
});
