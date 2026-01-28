// MapPickerModal.tsx
// マップから場所を選択するモーダル（WebView + Google Maps JavaScript API）

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import * as Location from "expo-location";
import { API_KEYS } from "../config";
import * as routeService from "../services/routeService";
import { ThemeContext } from "./ThemeContext";

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (
    address: string,
    coords: { latitude: number; longitude: number },
  ) => void;
  initialLocation?: string;
}

export default function MapPickerModal({
  visible,
  onClose,
  onSelect,
  initialLocation,
}: MapPickerModalProps) {
  const { theme } = useContext(ThemeContext);
  const webViewRef = useRef<WebView>(null);

  const screenBg = theme === "light" ? "#f2f2f7" : "#1c1c1e";
  const cardBg = theme === "light" ? "#fff" : "#2c2c2e";
  const textColor = theme === "light" ? "#000" : "#fff";
  const secondaryText = "#8e8e93";
  const headerBg = theme === "light" ? "#f2f2f7" : "#1c1c1e";
  const iconBg = theme === "light" ? "#e5e5ea" : "#3a3a3c";
  const inputBg = theme === "light" ? "#e5e5ea" : "#3a3a3c";

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [initialCenter, setInitialCenter] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 35.6812, lng: 139.7671 }); // 東京駅デフォルト
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedAddress("");
      setSelectedCoords(null);
      setSearchText("");
      setMapReady(false);
      setInitialized(false);
      resolveInitialCenter();
    }
  }, [visible]);

  const resolveInitialCenter = async () => {
    try {
      // 既存の場所テキストがあればジオコーディング
      if (initialLocation && initialLocation.trim()) {
        try {
          const coords = await routeService.geocodeAddress(initialLocation);
          setInitialCenter({ lat: coords.latitude, lng: coords.longitude });
          setInitialized(true);
          return;
        } catch {
          // フォールバック: 現在地
        }
      }

      // 現在地を取得
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setInitialCenter({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      }
    } catch (error) {
      console.error("位置取得エラー:", error);
    } finally {
      setInitialized(true);
    }
  };

  // WebViewからのメッセージを処理
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "mapClick" || data.type === "markerDragEnd") {
        setSelectedCoords({
          latitude: data.lat,
          longitude: data.lng,
        });
        setSelectedAddress(data.address || `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`);
      } else if (data.type === "mapReady") {
        setMapReady(true);
      }
    } catch (error) {
      console.error("WebViewメッセージ解析エラー:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    try {
      const coords = await routeService.geocodeAddress(searchText);
      // WebViewに座標を送信してマップを移動
      webViewRef.current?.injectJavaScript(`
        moveToLocation(${coords.latitude}, ${coords.longitude});
        true;
      `);
    } catch {
      Alert.alert("エラー", "場所が見つかりませんでした");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = () => {
    if (!selectedCoords) {
      Alert.alert("エラー", "地図をタップして場所を選択してください");
      return;
    }
    onSelect(selectedAddress, selectedCoords);
    onClose();
  };

  // Google Maps JavaScript APIを使ったHTML
  const mapHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; }
            html, body { height: 100%; }
            #map { height: 100%; width: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            let map;
            let marker;
            let geocoder;

            function initMap() {
              const center = { lat: ${initialCenter.lat}, lng: ${initialCenter.lng} };

              map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: center,
                disableDefaultUI: false,
                zoomControl: true,
                myLocationButtonEnabled: true,
                gestureHandling: 'greedy',
              });

              geocoder = new google.maps.Geocoder();

              // 地図タップでマーカー配置
              map.addListener('click', function(e) {
                placeMarker(e.latLng, true);
              });

              // マップ準備完了を通知
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
            }

            function placeMarker(latLng, doGeocode) {
              if (marker) {
                marker.setPosition(latLng);
              } else {
                marker = new google.maps.Marker({
                  position: latLng,
                  map: map,
                  draggable: true,
                  animation: google.maps.Animation.DROP,
                });

                marker.addListener('dragend', function(e) {
                  reverseGeocodeAndSend(e.latLng, 'markerDragEnd');
                });
              }

              if (doGeocode) {
                reverseGeocodeAndSend(latLng, 'mapClick');
              }
            }

            function reverseGeocodeAndSend(latLng, eventType) {
              const lat = latLng.lat();
              const lng = latLng.lng();

              geocoder.geocode({ location: latLng }, function(results, status) {
                let address = '';
                if (status === 'OK' && results[0]) {
                  address = results[0].formatted_address;
                }
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: eventType,
                  lat: lat,
                  lng: lng,
                  address: address,
                }));
              });
            }

            function moveToLocation(lat, lng) {
              const latLng = new google.maps.LatLng(lat, lng);
              map.panTo(latLng);
              map.setZoom(16);
              placeMarker(latLng, true);
            }
          </script>
          <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=${API_KEYS.GOOGLE_MAPS}&callback=initMap&language=ja">
          </script>
        </body>
      </html>
    `;
  }, [initialCenter]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: iconBg }]}
            onPress={onClose}
          >
            <Text style={[styles.headerIconText, { color: textColor }]}>
              ✕
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            場所を選択
          </Text>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: iconBg }]}
            onPress={handleSelect}
          >
            <Text style={[styles.headerIconText, { color: textColor }]}>
              ✓
            </Text>
          </TouchableOpacity>
        </View>

        {/* 検索バー */}
        <View style={[styles.searchContainer, { backgroundColor: screenBg }]}>
          <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="場所を検索"
              placeholderTextColor={secondaryText}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searching && (
              <ActivityIndicator size="small" color={secondaryText} />
            )}
          </View>
        </View>

        {/* マップ（WebView） */}
        <View style={styles.mapContainer}>
          {initialized ? (
            <WebView
              ref={webViewRef}
              source={{ html: mapHtml }}
              style={styles.map}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={{ color: secondaryText, marginTop: 8 }}>
                    地図を読み込み中...
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ color: secondaryText, marginTop: 8 }}>
                位置情報を取得中...
              </Text>
            </View>
          )}
        </View>

        {/* 選択した住所の表示 */}
        <View style={[styles.addressContainer, { backgroundColor: cardBg }]}>
          {selectedAddress ? (
            <View>
              <Text style={[styles.addressLabel, { color: secondaryText }]}>
                選択した場所
              </Text>
              <Text style={[styles.addressText, { color: textColor }]}>
                {selectedAddress}
              </Text>
            </View>
          ) : (
            <Text
              style={[styles.addressPlaceholder, { color: secondaryText }]}
            >
              地図をタップして場所を選択してください
            </Text>
          )}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 16 : 12,
    paddingBottom: 12,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconText: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 40,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addressContainer: {
    padding: 16,
    minHeight: 70,
    justifyContent: "center",
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
  },
  addressPlaceholder: {
    fontSize: 15,
    textAlign: "center",
  },
});
