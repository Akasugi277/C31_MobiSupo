// routeService.ts
// ルート検索・移動時間計算サービス

import axios from "axios";
import * as Location from "expo-location";
import { API_KEYS, API_ENDPOINTS } from "../config";
import { LocationCoords } from "./weatherService";

// 移動モードの型定義
export type TransportMode = "walking" | "driving" | "transit";

// 電車ルートの詳細情報
export interface TransitDetails {
  originStation?: string; // 出発駅
  destinationStation?: string; // 到着駅
  fare?: number; // 料金（円）
  transferCount?: number; // 乗り換え回数
  lines?: string[]; // 利用路線
  steps?: string[]; // 経路の各ステップ
  delayInfo?: Array<{
    lineName: string;
    lineNameJa: string;
    status: string;
    statusText: string;
    hasDelay: boolean;
  }>;
}

// ルート情報の型定義
export interface RouteInfo {
  mode: TransportMode;
  duration: number; // 所要時間（秒）
  durationText: string; // 所要時間（テキスト形式: "15分"）
  distance: number; // 距離（メートル）
  distanceText: string; // 距離（テキスト形式: "1.2 km"）
  departureTime?: Date; // 出発時刻（逆算用）
  startLocation?: LocationCoords; // 出発地の座標
  endLocation?: LocationCoords; // 目的地の座標
  polyline?: string; // ルートのポリライン
  coordinates?: Array<{ latitude: number; longitude: number }>; // ルートの座標配列
  transitDetails?: TransitDetails; // 電車ルートの詳細情報
}

// ルート検索のリクエストパラメータ
export interface RouteRequest {
  origin: LocationCoords | string; // 出発地（座標または住所）
  destination: string; // 目的地（住所または駅名）
  arrivalTime: Date; // 到着希望時刻
  mode?: TransportMode; // 移動モード（省略時は自動判定）
}

/**
 * 現在地を取得
 */
export async function getCurrentLocation(): Promise<LocationCoords> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("位置情報の許可が必要です");
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("現在地の取得に失敗:", error);
    throw error;
  }
}

/**
 * Google Maps APIを使用してルートを検索（徒歩・車）
 */
async function searchGoogleMapsRoute(
  origin: LocationCoords,
  destination: LocationCoords,
  mode: "walking" | "driving"
): Promise<RouteInfo> {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;

    const url = `${API_ENDPOINTS.GOOGLE_MAPS_DIRECTIONS}?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${API_KEYS.GOOGLE_MAPS}`;

    const response = await axios.get(url);

    console.log(`Google Maps (${mode}) ステータス:`, response.data.status);

    if (response.data.status !== "OK") {
      console.error(`Google Maps (${mode}) エラー:`, response.data.status);
      throw new Error(`ルート検索失敗: ${response.data.status}`);
    }

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        mode,
        duration: leg.duration.value, // 秒
        durationText: leg.duration.text,
        distance: leg.distance.value, // メートル
        distanceText: leg.distance.text,
      };
    }

    throw new Error("ルートが見つかりませんでした");
  } catch (error) {
    console.error(`Google Maps ルート検索エラー (${mode}):`, error);
    throw error;
  }
}

/**
 * 住所から座標を取得（Google Geocoding API）
 */
export async function geocodeAddress(address: string): Promise<LocationCoords> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEYS.GOOGLE_MAPS}&language=ja`;

    console.log("住所→座標変換 URL:", url);

    const response = await axios.get(url);

    if (response.data.status !== "OK") {
      console.error("Geocoding APIエラー:", response.data.status);
      throw new Error(`住所の座標取得失敗: ${response.data.status}`);
    }

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const coords = {
        latitude: location.lat,
        longitude: location.lng,
      };
      console.log("取得した座標:", coords);
      return coords;
    }

    throw new Error("座標が見つかりませんでした");
  } catch (error: any) {
    console.error("座標取得エラー:", error.message);
    throw error;
  }
}

/**
 * 座標から住所を取得（Google Geocoding API 逆ジオコーディング）
 */
export async function reverseGeocode(coords: LocationCoords): Promise<string> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${API_KEYS.GOOGLE_MAPS}&language=ja`;
    const response = await axios.get(url);

    if (response.data.status !== "OK") {
      throw new Error(`逆ジオコーディング失敗: ${response.data.status}`);
    }

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    throw new Error("住所が見つかりませんでした");
  } catch (error: any) {
    console.error("逆ジオコーディングエラー:", error.message);
    throw error;
  }
}

/**
 * 車ルートの所要時間から電車での所要時間を推定
 * Google Maps Directions API transit modeは日本国内で非対応のため、
 * 車ルートをベースに推定値を算出する
 *
 * 推定ロジック:
 * - 短距離（～10km）: 車の1.3倍（駅までの徒歩+待ち時間考慮）
 * - 中距離（10～50km）: 車の0.9倍（電車の方が速いことが多い）
 * - 長距離（50km～）: 車の0.7倍（新幹線・特急を想定）
 */
async function estimateTransitRoute(
  origin: LocationCoords,
  destination: LocationCoords
): Promise<RouteInfo> {
  // まず車ルートを取得
  const drivingRoute = await searchGoogleMapsRoute(origin, destination, "driving");

  const distanceKm = drivingRoute.distance / 1000;

  // 距離に応じた推定係数
  let factor: number;
  if (distanceKm <= 10) {
    factor = 1.3; // 短距離: 駅への移動+待ち時間で車より遅い
  } else if (distanceKm <= 50) {
    factor = 0.9; // 中距離: 電車がやや有利
  } else {
    factor = 0.7; // 長距離: 新幹線等で大幅に速い
  }

  const estimatedDuration = Math.round(drivingRoute.duration * factor);
  const estimatedMinutes = Math.round(estimatedDuration / 60);

  let durationText: string;
  if (estimatedMinutes < 60) {
    durationText = `約${estimatedMinutes}分`;
  } else {
    const hours = Math.floor(estimatedMinutes / 60);
    const mins = estimatedMinutes % 60;
    durationText = mins === 0 ? `約${hours}時間` : `約${hours}時間${mins}分`;
  }

  console.log(`電車ルート推定: 車${Math.round(drivingRoute.duration / 60)}分 × ${factor} = ${estimatedMinutes}分 (${distanceKm.toFixed(1)}km)`);

  return {
    mode: "transit",
    duration: estimatedDuration,
    durationText,
    distance: drivingRoute.distance,
    distanceText: drivingRoute.distanceText,
    startLocation: origin,
    endLocation: destination,
    transitDetails: {
      steps: [`推定所要時間（Google Mapsアプリで正確なルートを確認できます）`],
    },
  };
}

/**
 * ルートを検索して移動時間を計算
 */
export async function searchRoute(
  request: RouteRequest
): Promise<RouteInfo> {
  const mode = request.mode || "transit"; // デフォルトは公共交通機関

  let routeInfo: RouteInfo;

  // モードに応じてAPIを使い分け
  if (mode === "transit") {
    // 公共交通機関: 車ルートから推定
    routeInfo = await estimateTransitRoute(request.origin, request.destination);
  } else {
    // 徒歩・車: Google Maps APIを使用
    routeInfo = await searchGoogleMapsRoute(
      request.origin,
      request.destination,
      mode
    );
  }

  // 到着時刻から出発時刻を逆算
  routeInfo.departureTime = new Date(
    request.arrivalTime.getTime() - routeInfo.duration * 1000
  );

  return routeInfo;
}

/**
 * 複数のモードでルートを検索して比較
 * 出発地と目的地の両方を座標で受け取る
 */
export async function searchMultipleRoutes(
  origin: LocationCoords,
  destination: LocationCoords,
  arrivalTime: Date
): Promise<RouteInfo[]> {
  const results: RouteInfo[] = [];

  // 並行してすべてのルートを検索
  const promises = [
    // 1. 徒歩ルート（Google Maps）
    searchGoogleMapsRoute(origin, destination, "walking")
      .then((route) => ({ ...route, mode: "walking" as TransportMode }))
      .catch((error) => {
        console.warn("徒歩ルート検索に失敗:", error);
        return null;
      }),

    // 2. 車ルート（Google Maps）
    searchGoogleMapsRoute(origin, destination, "driving")
      .then((route) => ({ ...route, mode: "driving" as TransportMode }))
      .catch((error) => {
        console.warn("車ルート検索に失敗:", error);
        return null;
      }),

    // 3. 電車ルート（車ルートから推定）
    estimateTransitRoute(origin, destination)
      .then((route) => ({ ...route, mode: "transit" as TransportMode }))
      .catch((error) => {
        console.warn("電車ルート検索に失敗:", error);
        return null;
      }),
  ];

  const routeResults = await Promise.all(promises);

  // nullでない結果のみを追加し、到着時刻から出発時刻を計算
  for (const route of routeResults) {
    if (route) {
      route.departureTime = new Date(
        arrivalTime.getTime() - route.duration * 1000
      );
      // 座標情報を追加
      route.startLocation = origin;
      route.endLocation = destination;
      results.push(route);
    }
  }

  return results;
}

/**
 * 出発時刻を計算（準備時間も考慮）
 */
export function calculateDepartureTime(
  arrivalTime: Date,
  travelDuration: number, // 秒
  preparationTime: number = 15 * 60 // デフォルト15分（秒）
): {
  departureTime: Date;
  notificationTime: Date;
  preparationTimeMinutes: number;
} {
  // 出発時刻 = 到着時刻 - 移動時間 - 準備時間
  const departureTime = new Date(
    arrivalTime.getTime() - (travelDuration + preparationTime) * 1000
  );

  // 通知時刻 = 出発時刻の10分前
  const notificationTime = new Date(departureTime.getTime() - 10 * 60 * 1000);

  return {
    departureTime,
    notificationTime,
    preparationTimeMinutes: preparationTime / 60,
  };
}
