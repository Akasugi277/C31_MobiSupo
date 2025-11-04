// routeService.ts
// ルート検索・移動時間計算サービス

import axios from "axios";
import * as Location from "expo-location";
import { API_KEYS, API_ENDPOINTS } from "../config";
import { LocationCoords } from "./weatherService";

// 移動モードの型定義
export type TransportMode = "walking" | "driving" | "transit";

// ルート情報の型定義
export interface RouteInfo {
  mode: TransportMode;
  duration: number; // 所要時間（秒）
  durationText: string; // 所要時間（テキスト形式: "15分"）
  distance: number; // 距離（メートル）
  distanceText: string; // 距離（テキスト形式: "1.2 km"）
  departureTime?: Date; // 出発時刻（逆算用）
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
 * 座標から最寄り駅を取得（Google Places API）
 */
async function getNearestStationFromCoords(coords: LocationCoords): Promise<string> {
  try {
    // Google Places API Nearby Searchで最寄りの駅を検索
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.latitude},${coords.longitude}&radius=1000&type=transit_station&key=${API_KEYS.GOOGLE_MAPS}&language=ja`;

    console.log("最寄り駅検索 URL:", url);

    const response = await axios.get(url);

    console.log("Places API ステータス:", response.data.status);

    // ステータスチェック
    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      console.error("Places APIエラー:", response.data.status);
      console.error("エラーメッセージ:", response.data.error_message);
      throw new Error(`最寄り駅検索失敗: ${response.data.status}`);
    }

    if (response.data.results && response.data.results.length > 0) {
      // 最初の結果から駅名を取得
      const stationName = response.data.results[0].name;
      console.log("最寄り駅:", stationName);
      return stationName;
    }

    throw new Error("最寄り駅が見つかりませんでした");
  } catch (error: any) {
    console.error("最寄り駅取得エラー:", error.message);
    if (error.response) {
      console.error("Places API レスポンスデータ:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * 駅すぱあとAPIを使用してルートを検索（公共交通機関）
 * 注意: 駅すぱあとAPIキーを取得後に使用可能
 */
async function searchEkispertRoute(
  origin: LocationCoords,
  destination: LocationCoords
): Promise<RouteInfo> {
  // 駅すぱあとAPIキーが未設定の場合はエラー
  if (API_KEYS.EKISPERT === "YOUR_EKISPERT_API_KEY_HERE") {
    console.warn("駅すぱあとAPIキーが未設定です");
    throw new Error(
      "駅すぱあとAPIキーが未設定です。config.tsで設定してください。"
    );
  }

  try {
    // 出発地の最寄り駅を検索
    const originStation = await getNearestStationFromCoords(origin);
    console.log(`出発地の最寄り駅: ${originStation}`);

    // 目的地の最寄り駅を検索
    const destinationStation = await getNearestStationFromCoords(destination);
    console.log(`目的地の最寄り駅: ${destinationStation}`);

    // 駅名の正規化：「駅」という文字を削除
    const normalizeStationName = (name: string): string => {
      return name.replace(/駅$/, '').trim();
    };

    const normalizedOrigin = normalizeStationName(originStation);
    const normalizedDestination = normalizeStationName(destinationStation);

    // 駅すぱあとAPI: lightエンドポイント（フリープラン対応）
    const url = `${API_ENDPOINTS.EKISPERT_BASE}/search/course/light?key=${API_KEYS.EKISPERT}&from=${encodeURIComponent(normalizedOrigin)}&to=${encodeURIComponent(normalizedDestination)}`;

    console.log("駅すぱあとAPI リクエストURL:", url);
    console.log("出発地:", normalizedOrigin);
    console.log("目的地:", normalizedDestination);

    const response = await axios.get(url);

    console.log("駅すぱあとAPI レスポンス:", JSON.stringify(response.data, null, 2));

    // lightエンドポイントの場合、直接Courseデータが返らないことがある
    // ResourceURIのみが返る場合は、デフォルトの所要時間を使用
    if (response.data.ResultSet?.Course) {
      const course = response.data.ResultSet.Course[0];

      // 所要時間を計算
      const timeInfo = course.Route?.timeOnBoard || course.Route?.time || 30;
      const durationMinutes = typeof timeInfo === 'number' ? timeInfo : 30;
      const duration = durationMinutes * 60;

      return {
        mode: "transit",
        duration,
        durationText: `${durationMinutes}分`,
        distance: 0,
        distanceText: "-",
      };
    }

    // ResourceURIのみが返る場合（lightエンドポイントの制限）
    if (response.data.ResultSet?.ResourceURI) {
      console.warn("駅すぱあとAPI lightエンドポイントの制限: 詳細なルート情報が取得できません");
      console.warn("ResourceURI:", response.data.ResultSet.ResourceURI);

      // フォールバック: 平均的な電車移動時間を推定（30分）
      console.log("フォールバック: デフォルト所要時間（30分）を使用");
      return {
        mode: "transit",
        duration: 30 * 60, // 30分
        durationText: "約30分",
        distance: 0,
        distanceText: "-",
      };
    }

    throw new Error("ルートが見つかりませんでした");
  } catch (error: any) {
    console.error("駅すぱあと ルート検索エラー:", error.message);

    if (error.response) {
      console.error("ステータスコード:", error.response.status);
      console.error("レスポンスヘッダー:", error.response.headers);
      console.error("レスポンスデータ:", JSON.stringify(error.response.data, null, 2));
    }

    // 403エラーの場合、APIキーまたはリクエスト形式の問題
    if (error.response?.status === 403) {
      console.error("403エラー: APIキーが無効、期限切れ、またはリクエスト形式が正しくない可能性があります");
      console.error("使用しているAPIキー:", API_KEYS.EKISPERT);
    }

    // フォールバック: 駅すぱあとが使えない場合はエラーを投げる
    console.log("駅すぱあとAPIが使用できません");
    throw error; // エラーを投げて、searchMultipleRoutesでnullとして扱う
  }
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
    // 公共交通機関: 駅すぱあとAPIを使用（未設定時はGoogle Mapsにフォールバック）
    routeInfo = await searchEkispertRoute(request.origin, request.destination);
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
 * 出発地と目的地の両方を座標で受け取り、Google Places APIで最寄り駅を検索
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

    // 3. 電車ルート（駅すぱあと + Google Geocoding）
    searchEkispertRoute(origin, destination)
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
