// RouteMapModal.tsx
// ルート詳細を表示するモーダル

import React, { useContext, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { ThemeContext } from "./ThemeContext";
import { API_KEYS } from "../config";

interface DelayInfo {
  lineName: string;
  lineNameJa: string;
  status: string;
  statusText: string;
  hasDelay: boolean;
}

interface TransitDetails {
  originStation?: string;
  destinationStation?: string;
  fare?: number;
  transferCount?: number;
  lines?: string[];
  steps?: string[];
  delayInfo?: DelayInfo[];
}

interface RouteInfo {
  mode: string;
  duration: number;
  durationText: string;
  distance: number;
  distanceText: string;
  polyline?: string;
  coordinates?: Array<{ latitude: number; longitude: number }>;
  transitDetails?: TransitDetails;
}

interface RouteMapModalProps {
  visible: boolean;
  route: RouteInfo | null;
  startLocation?: { latitude: number; longitude: number };
  endLocation?: { latitude: number; longitude: number };
  onClose: () => void;
}

export default function RouteMapModal({
  visible,
  route,
  startLocation,
  endLocation,
  onClose,
}: RouteMapModalProps) {
  const { theme } = useContext(ThemeContext);
  const bgColor = theme === "light" ? "#fff" : "#333";
  const textColor = theme === "light" ? "#000" : "#fff";

  if (!route || !startLocation || !endLocation) {
    console.log("RouteMapModal: Missing data", { route, startLocation, endLocation });
    return null;
  }

  console.log("RouteMapModal: Rendering with", {
    visible,
    mode: route.mode,
    start: startLocation,
    end: endLocation
  });

  // 電車ルートの場合、詳細情報をログ出力
  if (route.mode === "transit" && route.transitDetails) {
    console.log("電車ルート詳細情報:", route.transitDetails);
    console.log("利用路線:", route.transitDetails.lines);
    console.log("経路ステップ:", route.transitDetails.steps);
  }

  const getModeText = (mode: string): string => {
    switch (mode) {
      case "walking":
        return "徒歩";
      case "transit":
        return "電車";
      case "driving":
        return "車";
      default:
        return mode;
    }
  };

  const getModeIcon = (mode: string): string => {
    switch (mode) {
      case "walking":
        return "🚶";
      case "transit":
        return "🚆";
      case "driving":
        return "🚗";
      default:
        return "📍";
    }
  };

  // Google Mapsアプリでルートを開く
  const openInGoogleMaps = () => {
    if (startLocation && endLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${startLocation.latitude},${startLocation.longitude}&destination=${endLocation.latitude},${endLocation.longitude}&travelmode=${
        route.mode === "walking" ? "walking" : route.mode === "transit" ? "transit" : "driving"
      }`;
      Linking.openURL(url);
    }
  };

  // ルートの色を取得
  const getRouteColor = () => {
    switch (route.mode) {
      case "walking":
        return "#34C759"; // 緑
      case "transit":
        return "#007AFF"; // 青
      case "driving":
        return "#FF9500"; // オレンジ
      default:
        return "#007AFF";
    }
  };

  // Google Maps用のHTMLを生成
  const mapHtml = useMemo(() => {
    const travelMode = route.mode === "walking" ? "WALKING" : route.mode === "transit" ? "TRANSIT" : "DRIVING";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; }
            html, body { height: 100%; }
            #map { height: 100%; width: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            function initMap() {
              const origin = { lat: ${startLocation.latitude}, lng: ${startLocation.longitude} };
              const destination = { lat: ${endLocation.latitude}, lng: ${endLocation.longitude} };

              const map = new google.maps.Map(document.getElementById('map'), {
                zoom: 13,
                center: origin,
              });

              const directionsService = new google.maps.DirectionsService();
              const directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                polylineOptions: {
                  strokeColor: '${getRouteColor()}',
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                },
                suppressMarkers: false,
              });

              const request = {
                origin: origin,
                destination: destination,
                travelMode: '${travelMode}',
              };

              directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                  directionsRenderer.setDirections(result);
                } else {
                  console.error('Directions request failed:', status);
                  // フォールバック: マーカーのみ表示
                  new google.maps.Marker({
                    position: origin,
                    map: map,
                    title: '出発地',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  });
                  new google.maps.Marker({
                    position: destination,
                    map: map,
                    title: '目的地',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  });

                  // 両方のポイントが見えるようにズーム調整
                  const bounds = new google.maps.LatLngBounds();
                  bounds.extend(origin);
                  bounds.extend(destination);
                  map.fitBounds(bounds);
                }
              });
            }
          </script>
          <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=${API_KEYS.GOOGLE_MAPS}&callback=initMap&language=ja">
          </script>
        </body>
      </html>
    `;
  }, [startLocation, endLocation, route.mode]);

  // 電車ルートかどうか
  const isTransit = route.mode === "transit";

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* ヘッダー */}
        <View style={[styles.header, { borderBottomColor: textColor + "20" }]}>
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeIcon}>{getModeIcon(route.mode)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.routeTitle, { color: textColor }]}>
                {getModeText(route.mode)}ルート
              </Text>
              <Text style={[styles.routeDetails, { color: textColor + "80" }]}>
                {route.durationText} • {route.distanceText}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: textColor + "20" }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: textColor }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 電車ルート（推定）or マップ */}
        {isTransit ? (
          <ScrollView style={styles.transitDetailsContainer}>
            {/* 推定所要時間 */}
            <View style={styles.estimateSection}>
              <Text style={styles.estimateIcon}>🚆</Text>
              <Text style={[styles.estimateTime, { color: textColor }]}>
                {route.durationText}
              </Text>
              <Text style={[styles.estimateNote, { color: textColor + "80" }]}>
                推定所要時間（車ルートから算出）
              </Text>
              <Text style={[styles.estimateDistance, { color: textColor + "60" }]}>
                距離: {route.distanceText}
              </Text>
            </View>

            {/* Google Mapsで正確なルートを確認 */}
            <TouchableOpacity
              style={styles.googleMapsTransitButton}
              onPress={openInGoogleMaps}
            >
              <Text style={styles.googleMapsTransitButtonText}>
                🗺️ Google Mapsで正確なルートを確認
              </Text>
              <Text style={styles.googleMapsTransitButtonSub}>
                乗り換え・料金・時刻表を確認できます
              </Text>
            </TouchableOpacity>

            {/* 注意事項 */}
            <View style={[styles.infoBox, { backgroundColor: textColor + "08" }]}>
              <Text style={[styles.infoBoxText, { color: textColor + "80" }]}>
                ※ 電車の所要時間は推定値です。正確な乗り換え情報・料金はGoogle Mapsアプリでご確認ください。
              </Text>
            </View>

            {/* 運行情報（遅延がある場合） */}
            {route.transitDetails?.delayInfo && route.transitDetails.delayInfo.some(d => d.hasDelay) && (
              <View style={styles.delaySection}>
                <Text style={styles.delaySectionTitle}>
                  ⚠️ 運行情報
                </Text>
                {route.transitDetails.delayInfo
                  .filter(d => d.hasDelay)
                  .map((delay, index) => (
                    <View key={index} style={styles.delayItem}>
                      <Text style={styles.delayLineName}>
                        {delay.lineNameJa}
                      </Text>
                      <Text style={styles.delayStatus}>
                        {delay.statusText}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.mapContainer}>
            <WebView
              source={{ html: mapHtml }}
              style={styles.webview}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={[styles.loadingText, { color: textColor }]}>
                    マップを読み込んでいます...
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Google Mapsで開くボタン */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={openInGoogleMaps}
          >
            <Text style={styles.openMapsButtonText}>
              🗺️ Google Mapsアプリで開く
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
  },
  routeInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  routeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  routeDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  openMapsButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  openMapsButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  transitDetailsContainer: {
    flex: 1,
    padding: 20,
  },
  stationSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  stationInfo: {
    alignItems: "center",
    marginVertical: 8,
  },
  stationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  stationName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  arrow: {
    fontSize: 24,
    marginVertical: 4,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
    paddingLeft: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  lineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingLeft: 8,
  },
  lineBullet: {
    fontSize: 16,
    marginRight: 8,
  },
  lineName: {
    fontSize: 14,
    flex: 1,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    paddingLeft: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "600",
  },
  stepName: {
    fontSize: 14,
    flex: 1,
  },
  delaySection: {
    marginBottom: 24,
    backgroundColor: "#FFF3F3",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  delaySectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 12,
  },
  delayItem: {
    marginBottom: 8,
  },
  delayLineName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  delayStatus: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  estimateSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  estimateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  estimateTime: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  estimateNote: {
    fontSize: 13,
    marginBottom: 4,
  },
  estimateDistance: {
    fontSize: 13,
  },
  googleMapsTransitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  googleMapsTransitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  googleMapsTransitButtonSub: {
    color: "#ffffffCC",
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
