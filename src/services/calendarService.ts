// calendarService.ts
// Google Calendar APIを使用してカレンダー情報を取得するサービス

import axios from "axios";
import { API_KEYS } from "../config";

// カレンダーイベントの型定義
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

/**
 * Google Calendar APIからイベントを取得
 * @param accessToken OAuth2アクセストークン
 * @param maxResults 取得する最大イベント数（デフォルト: 10）
 */
export async function fetchCalendarEvents(
  accessToken: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  try {
    const now = new Date().toISOString();

    // Google Calendar API v3のエンドポイント
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        timeMin: now,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: "startTime",
      },
    });

    console.log("Calendar API レスポンス:", response.data);

    // イベントデータを変換
    const events: CalendarEvent[] = response.data.items.map((item: any) => ({
      id: item.id,
      title: item.summary || "無題",
      start: new Date(item.start.dateTime || item.start.date),
      end: new Date(item.end.dateTime || item.end.date),
      location: item.location,
      description: item.description,
    }));

    return events;
  } catch (error: any) {
    console.error("Calendar API エラー:", error.message);
    if (error.response) {
      console.error("レスポンスステータス:", error.response.status);
      console.error("レスポンスデータ:", error.response.data);
    }
    throw error;
  }
}

/**
 * OAuth2アクセストークンを取得する（簡易版）
 * 注意: これは開発・テスト用の簡易実装です
 *
 * 手順:
 * 1. 以下のURLをブラウザで開く
 * 2. Googleアカウントでログインして許可
 * 3. リダイレクトされたURLからコードを取得
 * 4. そのコードをこの関数に渡す
 */
export function getAuthUrl(): string {
  const clientId = API_KEYS.GOOGLE_CALENDAR_CLIENT_ID;
  const redirectUri = "http://localhost"; // ウェブアプリケーション用
  const scope = "https://www.googleapis.com/auth/calendar.readonly";

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
}

/**
 * 認証コードからアクセストークンを取得
 * @param authCode 認証コード
 */
export async function exchangeCodeForToken(authCode: string): Promise<string> {
  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code: authCode,
        client_id: API_KEYS.GOOGLE_CALENDAR_CLIENT_ID,
        client_secret: API_KEYS.GOOGLE_CALENDAR_CLIENT_SECRET,
        redirect_uri: "http://localhost",
        grant_type: "authorization_code",
      }
    );

    console.log("アクセストークン取得成功");
    return response.data.access_token;
  } catch (error: any) {
    console.error("トークン取得エラー:", error.message);
    if (error.response) {
      console.error("レスポンスデータ:", error.response.data);
    }
    throw error;
  }
}
