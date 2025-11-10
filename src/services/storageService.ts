// storageService.ts
// AsyncStorageを使用してローカルストレージを管理するサービス

import AsyncStorage from "@react-native-async-storage/async-storage";

// ストレージキー
const KEYS = {
  GOOGLE_CALENDAR_ACCESS_TOKEN: "@google_calendar_access_token",
  GOOGLE_CALENDAR_REFRESH_TOKEN: "@google_calendar_refresh_token",
  EVENTS: "@events",
};

/**
 * Google Calendarアクセストークンを保存
 */
export async function saveGoogleCalendarToken(accessToken: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.GOOGLE_CALENDAR_ACCESS_TOKEN, accessToken);
    console.log("アクセストークンを保存しました");
  } catch (error) {
    console.error("アクセストークン保存エラー:", error);
    throw error;
  }
}

/**
 * Google Calendarアクセストークンを取得
 */
export async function getGoogleCalendarToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(KEYS.GOOGLE_CALENDAR_ACCESS_TOKEN);
    return token;
  } catch (error) {
    console.error("アクセストークン取得エラー:", error);
    return null;
  }
}

/**
 * Google Calendarアクセストークンを削除
 */
export async function clearGoogleCalendarToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.GOOGLE_CALENDAR_ACCESS_TOKEN);
    console.log("アクセストークンを削除しました");
  } catch (error) {
    console.error("アクセストークン削除エラー:", error);
    throw error;
  }
}

/**
 * Google Calendar認証済みかどうかをチェック
 */
export async function isGoogleCalendarAuthenticated(): Promise<boolean> {
  const token = await getGoogleCalendarToken();
  return token !== null && token.trim() !== "";
}

/**
 * 予定を保存
 */
export async function saveEvents(events: any[]): Promise<void> {
  try {
    // DateオブジェクトをJSON化できるように変換
    const eventsToSave = events.map(event => ({
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
    }));
    await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(eventsToSave));
    console.log("予定を保存しました:", eventsToSave.length, "件");
  } catch (error) {
    console.error("予定保存エラー:", error);
    throw error;
  }
}

/**
 * 予定を取得
 */
export async function getEvents(): Promise<any[]> {
  try {
    const eventsJson = await AsyncStorage.getItem(KEYS.EVENTS);
    if (!eventsJson) {
      return [];
    }
    // ISO文字列をDateオブジェクトに戻す
    const events = JSON.parse(eventsJson);
    return events.map((event: any) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
    }));
  } catch (error) {
    console.error("予定取得エラー:", error);
    return [];
  }
}

/**
 * すべての予定を削除
 */
export async function clearEvents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.EVENTS);
    console.log("すべての予定を削除しました");
  } catch (error) {
    console.error("予定削除エラー:", error);
    throw error;
  }
}
