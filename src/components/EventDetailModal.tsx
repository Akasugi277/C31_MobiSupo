// EventDetailModal.tsx
// 予定詳細表示モーダル

import React, { useContext } from "react";
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

interface EventDetailModalProps {
  visible: boolean;
  event: EventData | null;
  onClose: () => void;
  onDelete?: (eventId: string) => void;
}

export default function EventDetailModal({
  visible,
  event,
  onClose,
  onDelete,
}: EventDetailModalProps) {
  const { theme } = useContext(ThemeContext);
  const bgColor = theme === "light" ? "#fff" : "#333";
  const textColor = theme === "light" ? "#000" : "#fff";

  if (!event) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
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
    <Modal visible={visible} animationType="slide" transparent={true}>
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
            </View>
          </ScrollView>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>閉じる</Text>
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>削除</Text>
              </TouchableOpacity>
            )}
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
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
