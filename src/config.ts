// API Keys Configuration
// 環境変数から読み込み（.envファイルで設定）

export const API_KEYS = {
  // OpenWeatherMap API Key (天気情報取得用)
  OPENWEATHER: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || "",

  // Google Maps API Key (地図表示・ルート検索用)
  GOOGLE_MAPS: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",

  // ODPT API Key (公共交通オープンデータ - 運行情報取得用)
  ODPT: process.env.EXPO_PUBLIC_ODPT_API_KEY || "",

  // Google Calendar API - OAuth 2.0 Client
  GOOGLE_CALENDAR_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID || "",
  GOOGLE_CALENDAR_CLIENT_SECRET: process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_CLIENT_SECRET || "",
};

// API Endpoints
export const API_ENDPOINTS = {
  OPENWEATHER_BASE: "https://api.openweathermap.org/data/2.5",
  GOOGLE_MAPS_DIRECTIONS: "https://maps.googleapis.com/maps/api/directions/json",
  ODPT_BASE: "https://api.odpt.org/api/v4",
};
