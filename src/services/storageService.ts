// storageService.ts
// AsyncStorageを使用してローカルストレージを管理するサービス

import AsyncStorage from "@react-native-async-storage/async-storage";

// ストレージキー
const KEYS = {
  GOOGLE_CALENDAR_ACCESS_TOKEN: "@google_calendar_access_token",
  GOOGLE_CALENDAR_REFRESH_TOKEN: "@google_calendar_refresh_token",
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
