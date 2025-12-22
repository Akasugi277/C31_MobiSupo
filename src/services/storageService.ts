// storageService.ts
// AsyncStorageを使用してローカルストレージを管理するサービス

import AsyncStorage from "@react-native-async-storage/async-storage";

// ストレージキー
const KEYS = {
  GOOGLE_CALENDAR_ACCESS_TOKEN: "@google_calendar_access_token",
  GOOGLE_CALENDAR_REFRESH_TOKEN: "@google_calendar_refresh_token",
  EVENTS: "@events",
  WEATHER_NOTIFICATION_SETTINGS: "@weather_notification_settings",
};

// 天気通知設定の型定義
export interface WeatherNotificationSettings {
  enabled: boolean; // 天気連動通知を有効にするか
  rainMinutes: number; // 雨の時に追加する分数
  snowMinutes: number; // 雪の時に追加する分数
  thunderstormMinutes: number; // 雷雨の時に追加する分数
  cloudyMinutes: number; // 曇りの時に追加する分数
}

// デフォルト設定
const DEFAULT_WEATHER_SETTINGS: WeatherNotificationSettings = {
  enabled: true,
  rainMinutes: 15,
  snowMinutes: 15,
  thunderstormMinutes: 15,
  cloudyMinutes: 15,
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
 * @param events 保存する予定の配列
 * @param userId ユーザーID（指定しない場合は全ユーザー共通）
 */
export async function saveEvents(events: any[], userId?: string): Promise<void> {
  try {
    // DateオブジェクトをJSON化できるように変換
    const eventsToSave = events.map(event => ({
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
    }));
    const storageKey = userId ? `${KEYS.EVENTS}_${userId}` : KEYS.EVENTS;
    await AsyncStorage.setItem(storageKey, JSON.stringify(eventsToSave));
    console.log(`予定を保存しました (${userId || 'global'}):`, eventsToSave.length, "件");
  } catch (error) {
    console.error("予定保存エラー:", error);
    throw error;
  }
}

/**
 * 予定を取得
 * @param userId ユーザーID（指定しない場合は全ユーザー共通）
 */
export async function getEvents(userId?: string): Promise<any[]> {
  try {
    const storageKey = userId ? `${KEYS.EVENTS}_${userId}` : KEYS.EVENTS;
    const eventsJson = await AsyncStorage.getItem(storageKey);
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
 * @param userId ユーザーID（指定しない場合は全ユーザー共通）
 */
export async function clearEvents(userId?: string): Promise<void> {
  try {
    const storageKey = userId ? `${KEYS.EVENTS}_${userId}` : KEYS.EVENTS;
    await AsyncStorage.removeItem(storageKey);
    console.log(`すべての予定を削除しました (${userId || 'global'})`);
  } catch (error) {
    console.error("予定削除エラー:", error);
    throw error;
  }
}

/**
 * 天気通知設定を保存
 */
export async function saveWeatherNotificationSettings(
  settings: WeatherNotificationSettings
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      KEYS.WEATHER_NOTIFICATION_SETTINGS,
      JSON.stringify(settings)
    );
    console.log("天気通知設定を保存しました:", settings);
  } catch (error) {
    console.error("天気通知設定の保存エラー:", error);
    throw error;
  }
}

/**
 * 天気通知設定を取得
 */
export async function getWeatherNotificationSettings(): Promise<WeatherNotificationSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(
      KEYS.WEATHER_NOTIFICATION_SETTINGS
    );
    if (!settingsJson) {
      // 設定がない場合はデフォルト設定を返す
      return DEFAULT_WEATHER_SETTINGS;
    }
    const settings = JSON.parse(settingsJson);

    // 古い設定データにcloudyMinutesがない場合はデフォルト値を追加
    return {
      ...DEFAULT_WEATHER_SETTINGS,
      ...settings,
    };
  } catch (error) {
    console.error("天気通知設定の取得エラー:", error);
    // エラー時もデフォルト設定を返す
    return DEFAULT_WEATHER_SETTINGS;
  }
}
