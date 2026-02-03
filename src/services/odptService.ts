// odptService.ts
// ODPT（公共交通オープンデータ）APIを使用した電車運行情報サービス

import axios from "axios";
import { API_KEYS, API_ENDPOINTS } from "../config";

// ODPT TrainInformation レスポンス型
export interface OdptTrainInfo {
  "@id": string;
  "odpt:operator": string;
  "odpt:railway"?: string;
  "odpt:trainInformationStatus"?: string;
  "odpt:trainInformationText"?: { ja?: string; en?: string } | string;
  "dc:date": string;
}

// アプリ内で使用する遅延情報型
export interface TrainDelayInfo {
  lineName: string;
  lineNameJa: string;
  status: string;
  statusText: string;
  hasDelay: boolean;
  lastUpdated: string;
}

// キャッシュ（5分間有効）
let cachedTrainInfo: OdptTrainInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分

/**
 * ODPT APIから全路線の運行情報を取得
 */
export async function fetchTrainInformation(): Promise<OdptTrainInfo[]> {
  // キャッシュが有効ならそれを返す
  const now = Date.now();
  if (cachedTrainInfo && now - cacheTimestamp < CACHE_TTL) {
    return cachedTrainInfo;
  }

  try {
    if (!API_KEYS.ODPT) {
      console.warn("ODPT APIキーが未設定です");
      return [];
    }

    const url = `${API_ENDPOINTS.ODPT_BASE}/odpt:TrainInformation?acl:consumerKey=${API_KEYS.ODPT}`;
    const response = await axios.get(url, { timeout: 10000 });

    cachedTrainInfo = response.data;
    cacheTimestamp = now;

    console.log(`ODPT: ${response.data.length}件の運行情報を取得`);
    return response.data;
  } catch (error: any) {
    console.warn("ODPT 運行情報取得エラー:", error.message);
    return [];
  }
}

/**
 * Google Mapsが返す路線名に対して遅延情報をチェック
 */
export async function checkDelayForLines(
  googleMapsLineNames: string[]
): Promise<TrainDelayInfo[]> {
  try {
    const allInfo = await fetchTrainInformation();
    if (allInfo.length === 0) return [];

    const results: TrainDelayInfo[] = [];

    for (const lineName of googleMapsLineNames) {
      const normalized = normalizeLineName(lineName);

      // ODPT運行情報とマッチング
      const match = allInfo.find((info) => {
        const railway = info["odpt:railway"] || "";
        const infoText = extractText(info["odpt:trainInformationText"]);
        // railway URIまたはテキスト内に路線名が含まれるか
        return (
          railway.toLowerCase().includes(normalized.toLowerCase()) ||
          infoText.includes(lineName) ||
          infoText.includes(normalized)
        );
      });

      if (match) {
        const status = match["odpt:trainInformationStatus"] || "平常運転";
        const hasDelay = status !== "平常運転" && status !== "";
        const statusText = extractText(match["odpt:trainInformationText"]);

        results.push({
          lineName: match["odpt:railway"] || lineName,
          lineNameJa: lineName,
          status,
          statusText: statusText || status,
          hasDelay,
          lastUpdated: match["dc:date"],
        });
      }
    }

    return results;
  } catch (error: any) {
    console.warn("遅延情報チェック失敗:", error.message);
    return [];
  }
}

/**
 * ODPT trainInformationText フィールドからテキストを抽出
 */
function extractText(
  text: { ja?: string; en?: string } | string | undefined
): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text.ja || text.en || "";
}

/**
 * Google Maps路線名を正規化してODPTとマッチングしやすくする
 */
function normalizeLineName(name: string): string {
  return name
    .replace(/^JR/, "")
    .replace(/線$/, "")
    .replace(/ライン$/, "")
    .replace(/快速$/, "")
    .replace(/各停$/, "")
    .replace(/各駅停車$/, "")
    .replace(/急行$/, "")
    .replace(/特急$/, "")
    .replace(/準急$/, "")
    .replace(/通勤$/, "")
    .replace(/東京メトロ/, "")
    .replace(/都営/, "")
    .trim();
}
