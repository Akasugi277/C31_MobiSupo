// src/screens/CalendarScreen.tsx
import {
  addDays,
  format,
  format as formatDate,
  getDay,
  parseISO,
  subWeeks,
} from "date-fns";
import { ja } from "date-fns/locale";
import React, { useContext, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Agenda,
  DateData,
  Calendar as RNCalendar,
} from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import AddEventModal, { EventData } from "../components/AddEventModal";
import ShadowView from "../components/ShadowView";
import { ThemeContext } from "../components/ThemeContext";

// 祝日リストの型定義を追加
type HolidayList = Record<string, string>;

// 祝日リスト（実際はAPIで取得するなど）
const HOLIDAYS: HolidayList = {
  "2025-01-01": "元日",
  "2025-01-13": "成人の日",
  // ...他の祝日
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

type ViewMode = "day" | "week" | "month";

export default function CalendarScreen() {
  const { theme } = useContext(ThemeContext);
  const bgColor = theme === "light" ? "#fff" : "#333";
  const textColor = theme === "light" ? "#000" : "#fff";

  const [mode, setMode] = useState<ViewMode>("week");
  const [googleLinked, setGoogleLinked] = useState(false);

  // 選択日を今日に（安定化）
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // 予定データの状態管理
  const [events, setEvents] = useState<EventData[]>([]);

  // モーダルの表示状態
  const [showAddModal, setShowAddModal] = useState(false);

  // 予定をカレンダー形式に変換
  const items = useMemo(() => {
    const itemsMap: Record<
      string,
      { id: string; time: string; title: string }[]
    > = {};

    events.forEach((event) => {
      const dateKey = event.arrivalTime.toISOString().slice(0, 10);
      if (!itemsMap[dateKey]) {
        itemsMap[dateKey] = [];
      }
      itemsMap[dateKey].push({
        id: event.id,
        time: event.arrivalTime.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        title: `${event.title} (${event.destination})`,
      });
    });

    return itemsMap;
  }, [events]);

  // 予定を保存
  const handleSaveEvent = (event: EventData) => {
    setEvents((prev) => [...prev, event]);
    setShowAddModal(false);
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

  // Googleカレンダー連携ダミー
  const handleGoogleLink = async () => {
    // 本来はOAuth認証処理
    setGoogleLinked(true);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: bgColor }]}
      edges={["top", "bottom"]}
    >
      {/* ヘッダー: 表示モード切り替え + 予定追加ボタン */}
      <View style={styles.headerContainer}>
        <View style={styles.segmentContainer}>
          {(["day", "week", "month"] as ViewMode[]).map((m) => (
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
        {mode === "day" && (
          <DayView
            textColor={textColor}
            bgColor={bgColor}
            items={items}
            selectedDate={selectedDate}
            onDayPress={(d) => setSelectedDate(d.dateString)}
          />
        )}

        {mode === "week" && (
          <WeekView
            textColor={textColor}
            bgColor={bgColor}
            weekDates={weekDates}
            items={items}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
          />
        )}

        {mode === "month" && (
          <MonthView
            textColor={textColor}
            bgColor={bgColor}
            items={items}
            onDayPress={(d) => setSelectedDate(d.dateString)}
          />
        )}

        {/* Googleカレンダー連携UI */}
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <Text style={{ color: textColor, marginBottom: 8 }}>
            Googleカレンダー連携: {googleLinked ? "連携済み" : "未連携"}
          </Text>
          {!googleLinked && (
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLink}
            >
              <Text style={{ color: "#fff" }}>Googleカレンダーと連携する</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 予定作成モーダル */}
      <AddEventModal
        visible={showAddModal}
        selectedDate={selectedDate}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveEvent}
      />
    </SafeAreaView>
  );
}

/* ---------- DayView : Agenda を使用して日毎の予定を表示 ---------- */
function DayView({
  textColor,
  bgColor,
  items,
  selectedDate,
  onDayPress,
}: {
  textColor: string;
  bgColor: string;
  items: Record<string, { id: string; time: string; title: string }[]>;
  selectedDate: string;
  onDayPress: (d: DateData) => void;
}) {
  // Agenda に渡す items に selectedDate のキーが無ければ空配列を注入して安全に動作させる
  const agendaItems = { ...items };
  if (!agendaItems[selectedDate]) {
    agendaItems[selectedDate] = [];
  }

  // 日付を「2025年10月20日」形式で表示
  let jpDate = "";
  try {
    const dateObj = parseISO(selectedDate);
    jpDate = formatDate(dateObj, "yyyy年M月d日", { locale: ja });
  } catch {
    jpDate = selectedDate;
  }

  return (
    <>
      <ShadowView style={[styles.sectionHeader, { backgroundColor: "#000" }]}>
        <Text style={[styles.sectionHeaderText]}>{jpDate}</Text>
      </ShadowView>

      <Agenda
        items={agendaItems as any}
        selected={selectedDate}
        renderItem={(item: any) => (
          <ShadowView style={[styles.itemBox, { backgroundColor: bgColor }]}>
            <Text style={{ color: textColor }}>
              {item.time} {item.title}
            </Text>
          </ShadowView>
        )}
        renderEmptyDate={() => (
          <ShadowView style={[styles.itemBox, { backgroundColor: bgColor }]}>
            <Text style={{ color: textColor }}>予定はありません</Text>
          </ShadowView>
        )}
        rowHasChanged={() => true}
        onDayPress={onDayPress}
        theme={{
          agendaDayTextColor: textColor,
          agendaDayNumColor: textColor,
          agendaTodayColor: "#ff5c5c",
          backgroundColor: bgColor,
          agendaKnobColor: "#888",
        }}
        style={{ backgroundColor: bgColor }}
      />
    </>
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
}: {
  textColor: string;
  bgColor: string;
  weekDates: string[];
  items: Record<string, { id: string; time: string; title: string }[]>;
  selectedDate: string;
  onSelectDate: (d: string) => void;
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

          return (
            <TouchableOpacity
              key={d}
              style={[
                styles.weekDay,
                selected && { backgroundColor: "#007aff", borderRadius: 6 },
              ]}
              onPress={() => onSelectDate(d)}
            >
              <Text style={{ color: selected ? "#fff" : dayColor }}>
                {dayNum}
              </Text>
              <Text
                style={{ color: selected ? "#fff" : dayColor, fontSize: 12 }}
              >
                {dayText}
              </Text>
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
            <ShadowView
              key={it.id}
              style={[styles.itemBox, { backgroundColor: bgColor }]}
            >
              <Text style={{ color: textColor }}>
                {it.time} {it.title}
              </Text>
            </ShadowView>
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
    // 祝日用
    type?: string;
    text?: string;
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
  items: Record<string, { id: string; time: string; title: string }[]>;
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
    Object.keys(HOLIDAYS).forEach((date) => {
      marks[date] = {
        ...(marks[date] || {}),
        type: "holiday",
        text: HOLIDAYS[date],
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
          textMonthFontWeight: "700", // 修正
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
          arrowColor: textColor,
          backgroundColor: bgColor,
          "stylesheet.calendar.header": {
            dayTextAtIndex0: { color: "#ff4444" },
            dayTextAtIndex6: { color: "#4444ff" },
          },
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
          const isHoliday = (marking as any)?.type === "holiday";
          const isSelected = marking?.selected;
          const hasEvents = marking?.marked;
          const dayNum = new Date(date.timestamp).getDay();
          let dayColor = textColor;
          if (isHoliday || dayNum === 0) dayColor = "#FF3B30";
          if (dayNum === 6) dayColor = "#007AFF";
          if (bgColor === "#333") {
            if (isHoliday || dayNum === 0) dayColor = "#ff8888";
            if (dayNum === 6) dayColor = "#88aaff";
          }
          return (
            <View
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
                <Text style={styles.holidayText}>{(marking as any).text}</Text>
              )}
            </View>
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
  googleButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
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
