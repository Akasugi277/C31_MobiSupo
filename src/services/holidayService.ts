import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HOLIDAY_API_URL = 'https://holidays-jp.github.io/api/v1/date.json';
const CACHE_KEY = '@holiday_cache';
const CACHE_EXPIRY_KEY = '@holiday_cache_expiry';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

export type HolidayList = Record<string, string>;

/**
 * 祝日データを取得（キャッシュあり）
 */
export async function fetchHolidays(): Promise<HolidayList> {
  try {
    // キャッシュチェック
    const [cached, expiry] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEY),
      AsyncStorage.getItem(CACHE_EXPIRY_KEY),
    ]);

    const now = Date.now();
    if (cached && expiry && now < parseInt(expiry, 10)) {
      console.log('祝日データをキャッシュから取得');
      return JSON.parse(cached) as HolidayList;
    }

    // API から取得
    console.log('祝日データをAPIから取得中...');
    const response = await axios.get<HolidayList>(HOLIDAY_API_URL, {
      timeout: 10000,
    });

    const holidays = response.data;

    // キャッシュ保存
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(holidays)),
      AsyncStorage.setItem(CACHE_EXPIRY_KEY, String(now + CACHE_DURATION_MS)),
    ]);

    console.log(`祝日データ取得完了（${Object.keys(holidays).length}件）`);
    return holidays;
  } catch (error) {
    console.error('祝日データ取得エラー:', error);

    // フォールバック: キャッシュがあれば期限切れでも返す
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      console.warn('期限切れキャッシュを使用');
      return JSON.parse(cached) as HolidayList;
    }

    // フォールバック: 空オブジェクト
    return {};
  }
}

/**
 * キャッシュクリア（デバッグ用）
 */
export async function clearHolidayCache(): Promise<void> {
  await AsyncStorage.multiRemove([CACHE_KEY, CACHE_EXPIRY_KEY]);
  console.log('祝日キャッシュをクリアしました');
}
