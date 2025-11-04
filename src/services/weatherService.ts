// weatherService.ts
// 天気情報を取得するサービス

import * as Location from "expo-location";
import { API_KEYS, API_ENDPOINTS } from "../config";

// 天気データの型定義
export interface WeatherData {
  temperature: number; // 気温 (°C)
  description: string; // 天気の説明 (例: "晴れ", "曇り")
  main: string; // 天気の主要カテゴリ (例: "Clear", "Rain")
  emoji: string; // 天気の絵文字
  humidity: number; // 湿度 (%)
  windSpeed: number; // 風速 (m/s)
}

// 位置情報の型定義
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// 住所情報の型定義
export interface AddressData {
  city: string; // 市区町村
  prefecture: string; // 都道府県
  fullAddress: string; // 完全な住所
}

/**
 * 現在地の天気情報を取得
 */
export async function getCurrentWeather(): Promise<WeatherData> {
  try {
    // 位置情報の許可を確認
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("位置情報の許可が必要です");
    }

    // 現在地を取得
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // 天気情報を取得
    return await getWeatherByCoords({ latitude, longitude });
  } catch (error) {
    console.error("天気情報の取得に失敗:", error);
    throw error;
  }
}

/**
 * 座標から天気情報を取得
 */
export async function getWeatherByCoords(
  coords: LocationCoords
): Promise<WeatherData> {
  try {
    const url = `${API_ENDPOINTS.OPENWEATHER_BASE}/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEYS.OPENWEATHER}&units=metric&lang=ja`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`天気情報の取得に失敗: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: data.main.temp,
      description: data.weather[0].description,
      main: data.weather[0].main,
      emoji: getWeatherEmoji(data.weather[0].main),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    };
  } catch (error) {
    console.error("天気情報の取得に失敗:", error);
    throw error;
  }
}

/**
 * 天気に応じた絵文字を取得
 */
function getWeatherEmoji(main: string): string {
  switch (main) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "☁️";
    case "Rain":
      return "🌧️";
    case "Snow":
      return "❄️";
    case "Thunderstorm":
      return "⛈️";
    case "Drizzle":
      return "🌦️";
    case "Mist":
    case "Fog":
    case "Haze":
      return "🌫️";
    default:
      return "🌈";
  }
}

/**
 * 天気に基づいて推奨される移動手段を判定
 */
export function getRecommendedTransportMode(weather: WeatherData): {
  mode: "walking" | "transit" | "driving";
  reason: string;
} {
  // 雨や雪の場合
  if (weather.main === "Rain" || weather.main === "Snow" || weather.main === "Thunderstorm") {
    return {
      mode: "transit",
      reason: `${weather.emoji} ${weather.description}のため、公共交通機関がおすすめです`,
    };
  }

  // 晴れの場合
  if (weather.main === "Clear" && weather.temperature >= 15 && weather.temperature <= 25) {
    return {
      mode: "walking",
      reason: `${weather.emoji} 天気が良いので、徒歩もおすすめです`,
    };
  }

  // デフォルト
  return {
    mode: "transit",
    reason: `${weather.emoji} ${weather.description}`,
  };
}

/**
 * 天気に応じた移動時間の補正係数を取得
 * @returns 1.0 = 通常、1.2 = 20%増し、など
 */
export function getWeatherTimeMultiplier(weather: WeatherData): number {
  // 雨の場合は移動時間を10%増し
  if (weather.main === "Rain") {
    return 1.1;
  }

  // 雪の場合は移動時間を20%増し
  if (weather.main === "Snow") {
    return 1.2;
  }

  // 雷雨の場合は移動時間を15%増し
  if (weather.main === "Thunderstorm") {
    return 1.15;
  }

  // 通常
  return 1.0;
}

/**
 * 座標から住所を取得（逆ジオコーディング）
 */
export async function getAddressFromCoords(
  coords: LocationCoords
): Promise<AddressData> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      const prefecture = address.region || "";
      const city = address.city || address.subregion || "";
      const fullAddress = `${prefecture}${city}`;

      return {
        city,
        prefecture,
        fullAddress,
      };
    }

    throw new Error("住所の取得に失敗しました");
  } catch (error) {
    console.error("住所の取得に失敗:", error);
    throw error;
  }
}

/**
 * 現在地の住所を取得
 */
export async function getCurrentAddress(): Promise<AddressData> {
  try {
    // 位置情報の許可を確認
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("位置情報の許可が必要です");
    }

    // 現在地を取得
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // 住所を取得
    return await getAddressFromCoords({ latitude, longitude });
  } catch (error) {
    console.error("現在地の取得に失敗:", error);
    throw error;
  }
}
