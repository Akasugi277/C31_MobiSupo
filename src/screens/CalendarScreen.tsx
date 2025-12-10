// src/screens/CalendarScreen.tsx
import {
  addDays,
  format,
  getDay,
  subWeeks
} from "date-fns";
import { ja } from "date-fns/locale";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DateData,
  LocaleConfig,
  Calendar as RNCalendar,
} from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import AddEventModal, { EventData } from "../components/AddEventModal";
import EditEventModal from "../components/EditEventModal";
import EventDetailModal from "../components/EventDetailModal";
import ShadowView from "../components/ShadowView";
import { ThemeContext } from "../components/ThemeContext";
import * as storageService from "../services/storageService";

// カレンダーアイテム型定義
type CalendarItems = {
  [date: string]: Array<{ id: string; time: string; title: string }>;
};

// 日本語ロケール設定
LocaleConfig.locales["jp"] = {
  monthNames: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  monthNamesShort: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  dayNames: [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ],
  dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
  today: "今日",
};
LocaleConfig.defaultLocale = "jp";

// 祝日リストの型定義を追加
type HolidayList = Record<string, string>;

// 祝日リスト（2025年の日本の祝日）
const HOLIDAYS: HolidayList = {
  "2025-01-01": "元日",
  "2025-01-13": "成人の日",
  "2025-02-11": "建国記念の日",
  "2025-02-23": "天皇誕生日",
  "2025-02-24": "振替休日",
  "2025-03-20": "春分の日",
  "2025-04-29": "昭和の日",
  "2025-05-03": "憲法記念日",
  "2025-05-04": "みどりの日",
  "2025-05-05": "こどもの日",
  "2025-05-06": "振替休日",
  "2025-07-21": "海の日",
  "2025-08-11": "山の日",
  "2025-09-15": "敬老の日",
  "2025-09-23": "秋分の日",
  "2025-10-13": "スポーツの日",
  "2025-11-03": "文化の日",
  "2025-11-23": "勤労感謝の日",
  "2025-11-24": "振替休日",
  // 2026年の祝日
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日",
  "2026-03-20": "春分の日",
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-22": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
};

// 日付の色を判定
function getDayColor(dateStr: string, textColor: string): string {
  const date = new Date(dateStr);
  const day = getDay(date);
  if (HOLIDAYS[dateStr]) return "#ff4444";
  if (day === 0) return "#ff4444"; // 日曜
  if (day === 6) return "#4444ff"; // 土曜
  return textColor;
}

type ViewMode = "week" | "month";

export default function CalendarScreen() {
  const { theme } = useContext(ThemeContext);
  const bgColor = theme === "light" ? "#fff" : "#333";
  const textColor = theme === "light" ? "#000" : "#fff";

  const [mode, setMode] = useState<ViewMode>("week");

  // 選択日を今日に（安定化）
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // 予定データの状態管理
  const [events, setEvents] = useState<EventData[]>([]);

  // モーダルの表示状態
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

  // 初回マウント時に保存された予定を読み込む
  useEffect(() => {
    loadEvents();
  }, []);

  // 予定が変更されたら自動保存
  useEffect(() => {
    if (events.length > 0) {
      storageService.saveEvents(events);
    }
  }, [events]);

  // 予定を読み込む
  const loadEvents = async () => {
    try {
      const savedEvents = await storageService.getEvents();
      if (savedEvents.length > 0) {
        setEvents(savedEvents);
        console.log("予定を読み込みました:", savedEvents.length, "件");
      }
    } catch (error) {
      console.error("予定読み込みエラー:", error);
    }
  };

  // 予定をカレンダー形式に変換
  const items = useMemo(() => {
    const itemsMap: CalendarItems = {};

    events.forEach((event) => {
      const dateKey = event.startTime.toISOString().slice(0, 10);
      if (!itemsMap[dateKey]) {
        itemsMap[dateKey] = [];
      }
      itemsMap[dateKey].push({
        id: event.id,
        time: event.startTime.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        title: event.location ? `${event.title} (${event.location})` : event.title,
      });
    });

    return itemsMap;
  }, [events]);

  // 予定を保存
  const handleSaveEvent = (event: EventData) => {
    setEvents((prev) => [...prev, event]);
    setShowAddModal(false);
  };

  // 予定をタップして詳細表示
  const handleEventPress = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowDetailModal(true);
    }
  };

  // 予定を削除
  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // 予定を更新
  const handleUpdateEvent = async (updatedEvent: EventData) => {
    const updatedEvents = events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    setEvents(updatedEvents);
    await storageService.saveEvents(updatedEvents);
    setShowEditModal(false);
    console.log("予定を更新しました:", updatedEvent.id);
  };

  // 編集ボタン押下時
  const handleEditEvent = (event: EventData) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  // Week の日配列（選択日が属する週: 日曜始まり）
  const weekDates = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay(); // 0=Sun
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    return Array.from({ length: 7 }).map((_, i) => {
      const dd = new Date(sunday);
      dd.setDate(sunday.getDate() + i);
      const yyyy = dd.getFullYear();
      const mm = String(dd.getMonth() + 1).padStart(2, "0");
      const ddn = String(dd.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${ddn}`;
    });
  }, [selectedDate]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: bgColor }]}
      edges={["top", "bottom"]}
    >
      {/* ヘッダー: 表示モード切り替え + 予定追加ボタン */}
      <View style={styles.headerContainer}>
        <View style={styles.segmentContainer}>
          {(["week", "month"] as ViewMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.segmentButton,
                mode === m && { backgroundColor: "#007aff" },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: mode === m ? "#fff" : textColor },
                ]}
              >
                {m === "week" ? "週間" : "月間"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ 予定を追加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === "week" && (
          <WeekView
            textColor={textColor}
            bgColor={bgColor}
            weekDates={weekDates}
            items={items}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            onEventPress={handleEventPress}
          />
        )}

        {mode === "month" && (
          <MonthView
            textColor={textColor}
            bgColor={bgColor}
            items={items}
            onDayPress={(d) => {
              setSelectedDate(d.dateString);
              // 予定がある日をタップしたら週間ビューに切り替え
              if (items[d.dateString] && items[d.dateString].length > 0) {
                setMode("week");
              }
            }}
          />
        )}
      </ScrollView>

      {/* 予定作成モーダル */}
      <AddEventModal
        visible={showAddModal}
        selectedDate={selectedDate}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveEvent}
      />

      {/* 予定詳細モーダル */}
      <EventDetailModal
        visible={showDetailModal}
        event={selectedEvent}
        onClose={() => setShowDetailModal(false)}
        onDelete={handleDeleteEvent}
        onEdit={handleEditEvent}
      />

      {/* 予定編集モーダル */}
      <EditEventModal
        visible={showEditModal}
        event={editingEvent}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateEvent}
      />
    </SafeAreaView>
  );
}

/* ---------- WeekView : 週の日を横並びで選べる簡易ビュー ---------- */
function WeekView({
  textColor,
  bgColor,
  weekDates,
  items,
  selectedDate,
  onSelectDate,
  onEventPress,
}: {
  textColor: string;
  bgColor: string;
  weekDates: string[];
  items: CalendarItems;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onEventPress: (eventId: string) => void;
}) {
  // 週の範囲文字列を生成
  const weekRangeText = useMemo(() => {
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);
    return `${format(start, "yyyy年M月d日", { locale: ja })}～${format(
      end,
      "yyyy年M月d日",
      { locale: ja }
    )}週`;
  }, [weekDates]);

  return (
    <>
      <ShadowView style={[styles.sectionHeader, { backgroundColor: "#000" }]}>
        <View style={styles.weekHeaderContainer}>
          <TouchableOpacity
            style={styles.weekChangeButton}
            onPress={() => {
              const newDate = subWeeks(new Date(selectedDate), 1);
              onSelectDate(format(newDate, "yyyy-MM-dd"));
            }}
          >
            <Text style={styles.weekChangeButtonText}>←前週</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionHeaderText]}>{weekRangeText}</Text>
          <TouchableOpacity
            style={styles.weekChangeButton}
            onPress={() => {
              const newDate = addDays(new Date(selectedDate), 7);
              onSelectDate(format(newDate, "yyyy-MM-dd"));
            }}
          >
            <Text style={styles.weekChangeButtonText}>次週→</Text>
          </TouchableOpacity>
        </View>
      </ShadowView>

      <View style={[styles.weekStrip]}>
        {weekDates.map((d) => {
          const dayNum = format(new Date(d), "d");
          const dayText = format(new Date(d), "E", { locale: ja });
          const has = items[d] && items[d].length > 0;
          const selected = d === selectedDate;
          const dayColor = getDayColor(d, textColor);
          const isHoliday = HOLIDAYS[d];

          return (
            <TouchableOpacity
              key={d}
              style={[
                styles.weekDay,
                selected && { backgroundColor: "#007aff", borderRadius: 6 },
              ]}
              onPress={() => onSelectDate(d)}
            >
              <Text style={{ color: selected ? "#fff" : dayColor, fontWeight: '600' }}>
                {dayNum}
              </Text>
              <Text
                style={{ color: selected ? "#fff" : dayColor, fontSize: 12 }}
              >
                {dayText}
              </Text>
              {isHoliday && (
                <Text
                  style={{
                    color: selected ? "#fff" : "#ff4444",
                    fontSize: 8,
                    textAlign: "center",
                    marginTop: 2,
                  }}
                >
                  {isHoliday}
                </Text>
              )}
              {has && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: selected ? "#fff" : "#ff0" },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 選択日の予定を下に表示 */}
      <View style={{ marginTop: 8 }}>
        {(items[selectedDate] || []).length === 0 ? (
          <ShadowView style={[styles.itemBox, { backgroundColor: bgColor }]}>
            <Text style={{ color: textColor }}>予定はありません</Text>
          </ShadowView>
        ) : (
          (items[selectedDate] || []).map((it) => (
            <TouchableOpacity key={it.id} onPress={() => onEventPress(it.id)}>
              <ShadowView
                style={[styles.itemBox, { backgroundColor: bgColor }]}
              >
                <Text style={{ color: textColor }}>
                  {it.time} {it.title}
                </Text>
              </ShadowView>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );
}

/* ---------- MonthView : カレンダーにマーク表示 + 土日祝日対応 ---------- */
// MarkedDates型を自作
type MyMarkedDates = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    marked?: boolean;
    dotColor?: string;
  };
};

function MonthView({
  textColor,
  bgColor,
  items,
  onDayPress,
}: {
  textColor: string;
  bgColor: string;
  items: CalendarItems;
  onDayPress: (d: DateData) => void;
}) {
  // マーク付きの日付を準備
  const markedDates: MyMarkedDates = useMemo(() => {
    const marks: MyMarkedDates = {};
    const today = new Date().toISOString().split("T")[0];
    marks[today] = {
      selected: true,
      selectedColor: "#007AFF",
    };
    Object.keys(items).forEach((date) => {
      marks[date] = {
        ...(marks[date] || {}),
        marked: true,
        dotColor: "#FF3B30",
      };
    });
    return marks;
  }, [items]);

  // テーマごとのカレンダー色設定
  const calendarTheme = {
    calendarBackground: bgColor,
    textSectionTitleColor: textColor,
    selectedDayBackgroundColor: "#007AFF",
    selectedDayTextColor: "#fff",
    todayTextColor: "#007AFF",
    dayTextColor: textColor,
    textDisabledColor: textColor + "40",
    monthTextColor: textColor,
    textMonthFontWeight: "700", // 修正
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 14,
    arrowColor: textColor,
    backgroundColor: bgColor,
    // ヘッダーの曜日色分け
    "stylesheet.calendar.header": {
      dayTextAtIndex0: { color: "#ff4444" }, // 日曜
      dayTextAtIndex6: { color: "#4444ff" }, // 土曜
    },
  };

  // 現在表示中の月を取得
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, "yyyy-MM", { locale: ja });
  });

  // 日本語の月タイトル
  const japaneseMonthTitle = useMemo(() => {
    const [year, month] = currentMonth.split("-");
    return `${year}年${parseInt(month, 10)}月`;
  }, [currentMonth]);

  return (
    <>
      <ShadowView style={[styles.monthHeader, { backgroundColor: "#000" }]}>
        <Text style={styles.monthHeaderText}>{japaneseMonthTitle}</Text>
      </ShadowView>
      <RNCalendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        firstDay={0}
        enableSwipeMonths={true}
        theme={{
          calendarBackground: bgColor,
          textSectionTitleColor: textColor,
          selectedDayBackgroundColor: "#007AFF",
          selectedDayTextColor: "#fff",
          todayTextColor: "#007AFF",
          dayTextColor: textColor,
          textDisabledColor: textColor + "40",
          monthTextColor: textColor,
          textMonthFontWeight: "700",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
          arrowColor: textColor,
        }}
        markingType={"custom"}
        // 月が変わった時にタイトルを更新
        onMonthChange={(dateObj) => {
          setCurrentMonth(
            `${dateObj.year}-${String(dateObj.month).padStart(2, "0")}`
          );
        }}
        dayComponent={({ date, state, marking }) => {
          if (!date) return null;
          const isDisabled = state === "disabled";
          const customMarking = marking as MyMarkedDates[string] | undefined;
          const isHoliday = HOLIDAYS[date.dateString]; // 直接HOLIDAYSから取得
          const isSelected = customMarking?.selected;
          const hasEvents = customMarking?.marked;
          const dayNum = new Date(date.timestamp).getDay();
          let dayColor = textColor;
          if (isHoliday || dayNum === 0) dayColor = "#FF3B30";
          if (dayNum === 6) dayColor = "#007AFF";
          if (bgColor === "#333") {
            if (isHoliday || dayNum === 0) dayColor = "#ff8888";
            if (dayNum === 6) dayColor = "#88aaff";
          }
          return (
            <TouchableOpacity
              onPress={() => {
                if (!isDisabled) {
                  onDayPress({
                    dateString: date.dateString,
                    day: date.day,
                    month: date.month,
                    year: date.year,
                    timestamp: date.timestamp,
                  });
                }
              }}
              disabled={isDisabled}
              style={[
                styles.calendarDay,
                isSelected && { backgroundColor: "#007AFF", borderRadius: 20 },
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  { color: isDisabled ? dayColor + "40" : dayColor },
                  isSelected && { color: "#fff" },
                ]}
              >
                {date.day}
              </Text>
              {hasEvents && (
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: isSelected ? "#fff" : "#FF3B30" },
                  ]}
                />
              )}
              {isHoliday && (
                <Text style={[styles.holidayText, isSelected && { color: "#fff" }]}>
                  {isHoliday}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  segmentContainer: {
    flexDirection: "row",
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  addButton: {
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentText: { fontSize: 14 },
  content: {
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 60,
  },
  sectionHeader: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  sectionHeaderText: {
    color: "#fff",
    fontWeight: "bold",
  },
  itemBox: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  monthCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#888",
  },
  /* Week strip styles */
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  weekHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  weekChangeButton: {
    padding: 4,
  },
  weekChangeButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  weekDay: {
    alignItems: "center",
    padding: 8,
    width: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  calendarDay: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: "400",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 4,
  },
  holidayText: {
    position: "absolute",
    bottom: 0,
    fontSize: 8,
    color: "#FF3B30",
  },
  monthHeader: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  monthHeaderText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
