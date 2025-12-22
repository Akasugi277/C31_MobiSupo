// src/screens/SettingsScreen.tsx
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ShadowView from "../components/ShadowView";
import { ThemeContext } from "../components/ThemeContext";
import * as authService from "../services/authService";
import * as storageService from "../services/storageService";
import { User, UserClass } from "../types/user";

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const textColor = theme === "light" ? "#000" : "#fff";
  const bgColor = theme === "light" ? "#fff" : "#333";
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ダミーユーザー
  const [googleLinked, setGoogleLinked] = useState(false);
  const [icloudLinked, setIcloudLinked] = useState(true);

  // 天気通知設定
  const [weatherSettings, setWeatherSettings] =
    useState<storageService.WeatherNotificationSettings>({
      enabled: true,
      rainMinutes: 15,
      snowMinutes: 15,
      thunderstormMinutes: 15,
      cloudyMinutes: 15,
    });

  // 初回読み込み時に設定を取得
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await storageService.getWeatherNotificationSettings();
      setWeatherSettings(settings);
    };
    loadSettings();
    loadCurrentUser();
  }, []);

  // 現在のユーザーを読み込み
  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  // 天気通知設定を保存
  const saveWeatherSettings = async (
    newSettings: storageService.WeatherNotificationSettings
  ) => {
    try {
      await storageService.saveWeatherNotificationSettings(newSettings);
      setWeatherSettings(newSettings);
      Alert.alert("保存完了", "天気通知設定を保存しました");
    } catch (error) {
      console.error("設定保存エラー:", error);
      Alert.alert("エラー", "設定の保存に失敗しました");
    }
  };

  // Googleカレンダー連携ダミー
  const handleGoogleLink = async () => {
    // 本来はOAuth認証処理
    setGoogleLinked(true);
  };

  // スケジュール済み通知を確認（現在のユーザーのみ）
  const checkScheduledNotifications = async () => {
    try {
      // 現在のユーザーの予定を取得
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert("エラー", "ログインしていません");
        return;
      }
      
      const userEvents = await storageService.getEvents(user.id);
      
      // ユーザーの予定に関連する通知IDを収集
      const userNotificationIds = new Set<string>();
      userEvents.forEach((event: any) => {
        if (event.notificationIds?.departure) {
          userNotificationIds.add(event.notificationIds.departure);
        }
        if (event.notificationIds?.preparation) {
          userNotificationIds.add(event.notificationIds.preparation);
        }
      });
      
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      
      // 現在のユーザーの通知のみをフィルタリング
      const userNotifications = notifications.filter(n => 
        userNotificationIds.has(n.identifier)
      );

      if (userNotifications.length === 0) {
        Alert.alert("通知", "スケジュール済みの通知はありません。");
        return;
      }

      const notificationList = userNotifications
        .map((n, index) => {
          const trigger = n.trigger as any;
          let timeString = "不明";

          if (trigger.type === "timeInterval" && trigger.seconds) {
            const date = new Date(Date.now() + trigger.seconds * 1000);
            timeString = date.toLocaleString("ja-JP");
          } else if (trigger.date) {
            timeString = new Date(trigger.date).toLocaleString("ja-JP");
          }

          return `${index + 1}. ${n.content.title}\n   ${timeString}\n   ID: ${
            n.identifier
          }`;
        })
        .join("\n\n");

      Alert.alert(
        `スケジュール済み通知 (${userNotifications.length}件)`,
        notificationList,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "全て削除",
            style: "destructive",
            onPress: async () => {
              try {
                // ユーザーの通知のみを削除
                for (const notification of userNotifications) {
                  await Notifications.cancelScheduledNotificationAsync(
                    notification.identifier
                  );
                }
                console.log("✅ ユーザーの全ての通知を削除しました");
                
                // 削除後、通知が本当に削除されたか確認
                const remainingNotifications = 
                  await Notifications.getAllScheduledNotificationsAsync();
                const remainingUserNotifications = remainingNotifications.filter(n =>
                  userNotificationIds.has(n.identifier)
                );
                
                if (remainingUserNotifications.length === 0) {
                  Alert.alert("完了", "全ての通知を削除しました");
                } else {
                  Alert.alert(
                    "警告", 
                    `${remainingUserNotifications.length}件の通知が削除されませんでした`
                  );
                }
              } catch (error) {
                console.error("通知削除エラー:", error);
                Alert.alert("エラー", "通知の削除に失敗しました");
              }
            },
          },
        ]
      );

      console.log("📋 スケジュール済み通知:", notifications);
    } catch (error) {
      console.error("通知確認エラー:", error);
      Alert.alert("エラー", "通知の確認に失敗しました");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: bgColor }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        style={[styles.screen, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.container}
      >
        {/* ユーザー情報セクション */}
        <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            ユーザー情報
          </Text>
          {currentUser && (
            <>
              <View style={styles.userInfoRow}>
                <Text style={[styles.label, { color: textColor }]}>
                  表示名: {currentUser.displayName}
                </Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={[styles.label, { color: textColor }]}>
                  ユーザー名: @{currentUser.username}
                </Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={[styles.label, { color: textColor }]}>
                  Email: {currentUser.email}
                </Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={[styles.label, { color: textColor }]}>
                  クラス: {
                    currentUser.userClass === UserClass.ADMIN
                      ? "管理者"
                      : currentUser.userClass === UserClass.USER
                      ? "ユーザー"
                      : "未登録"
                  }
                </Text>
              </View>
            </>
          )}
          <TouchableOpacity 
            style={styles.buttonRow}
            onPress={() => navigation.navigate("AccountSettings")}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>
              ▶ アカウント設定
            </Text>
          </TouchableOpacity>
          {currentUser && currentUser.userClass === UserClass.ADMIN && (
            <TouchableOpacity 
              style={styles.buttonRow}
              onPress={() => navigation.navigate("UserManagement")}
            >
              <Text style={[styles.buttonText, { color: "#FF3B30" }]}>
                ▶ ユーザー管理（管理者専用）
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.buttonRow, { marginTop: 12 }]}
            onPress={async () => {
              Alert.alert(
                "ログアウト",
                "ログアウトしますか？",
                [
                  { text: "キャンセル", style: "cancel" },
                  {
                    text: "ログアウト",
                    style: "destructive",
                    onPress: async () => {
                      await authService.logout();
                      // ログアウト後は自動的にログイン画面に遷移
                    },
                  },
                ]
              );
            }}
          >
            <Text style={[styles.buttonText, { color: "#FF3B30" }]}>
              ▶ ログアウト
            </Text>
          </TouchableOpacity>
        </ShadowView>

        {/* プロフィール情報（旧） - 削除予定 */}
        {/* <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
          <View style={styles.avatarRow}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=3" }}
              style={styles.avatarPlaceholder}
            />
            <TouchableOpacity style={styles.avatarChange}>
              <Text style={{ color: textColor }}>変更</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.label, { color: textColor }]}>Kanamu Kato</Text>
          <Text style={[styles.label, { color: textColor }]}>
            ここに自己紹介を入力
          </Text>
          <Text style={[styles.label, { color: textColor }]}>
            ユーザー名：Kanamu Kato
          </Text>
          <Text style={[styles.label, { color: textColor }]}>
            Email：kanamu@example.com
          </Text>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              ▶ アカウント設定
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              ▶ Apple/Googleカレンダー連携
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              ▶ アプリの設定
            </Text>
          </TouchableOpacity>
        </ShadowView> */}

        {/* カレンダー連携セクション */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          カレンダー連携
        </Text>
        <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              ▶ Apple/Googleカレンダー連携
            </Text>
          </TouchableOpacity>
        </ShadowView>

        {/* 旧アカウント設定セクション（コメントアウト） */}
        {/* <Text style={[styles.sectionTitle, { color: textColor }]}>
          アカウント設定
        </Text>
        <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              ユーザー名・ニックネーム変更する
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              メールアドレスを変更する
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              パスワードを変更する
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              アバターを変更する
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              アカウントを削除する
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              ログアウトする
            </Text>
          </TouchableOpacity>
        </ShadowView> */}

        {/* カレンダー連携（旧） */}
        {/* <Text style={[styles.sectionTitle, { color: textColor }]}>
          カレンダー連携
        </Text>
        <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
          <View style={styles.linkRow}>
            <Text style={{ color: icloudLinked ? "green" : "red" }}>
              iCloudカレンダー：{icloudLinked ? "連携済み" : "未連携"}
            </Text>
            <Text style={[styles.linkSub, { color: textColor }]}>
              kanamu@icloud.com
            </Text>
          </View>
          <View style={styles.linkRow}>
            <Text style={{ color: googleLinked ? "green" : "red" }}>
              Googleカレンダー：{googleLinked ? "連携済み" : "未連携"}
            </Text>
            {!googleLinked && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleGoogleLink}
              >
                <Text style={{ color: "#4285F4" }}>連携する</Text>
              </TouchableOpacity>
            )}
          </View>
        </ShadowView> */}

        {/* アプリの設定 */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          アプリの設定
        </Text>
        <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
          <TouchableOpacity style={styles.buttonRow} onPress={toggleTheme}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              {theme === "light"
                ? "🌙 ダークモードに切替"
                : "☀️ ライトモードに切替"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonRow}
            onPress={checkScheduledNotifications}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>
              🔔 スケジュール済み通知を確認
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              API設定
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              通知設定
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              アクセス権限
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonRow}>
            <Text style={[styles.buttonText, { color: textColor }]}>
              バージョン情報
            </Text>
          </TouchableOpacity>
        </ShadowView>

        {/* 天気連動通知設定 */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          天気連動通知設定
        </Text>
        <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
          {/* オン/オフ切り替え */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: textColor }]}>
              🌤️ 天気による通知時刻の自動調整
            </Text>
            <Switch
              value={weatherSettings.enabled}
              onValueChange={(value) => {
                const newSettings = { ...weatherSettings, enabled: value };
                saveWeatherSettings(newSettings);
              }}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={weatherSettings.enabled ? "#007AFF" : "#f4f3f4"}
            />
          </View>

          {weatherSettings.enabled && (
            <>
              <Text
                style={[styles.settingDescription, { color: textColor + "80" }]}
              >
                天気が悪い時に通知を早めます。ルート設定時に有効。
              </Text>

              {/* 雨の設定 */}
              <View style={styles.weatherInputRow}>
                <Text style={[styles.weatherLabel, { color: textColor }]}>
                  🌧️ 雨の時
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.numberInput,
                      { color: textColor, borderColor: textColor },
                    ]}
                    value={String(weatherSettings.rainMinutes)}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setWeatherSettings({
                        ...weatherSettings,
                        rainMinutes: num,
                      });
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={[styles.unitText, { color: textColor }]}>
                    分早める
                  </Text>
                </View>
              </View>

              {/* 雪の設定 */}
              <View style={styles.weatherInputRow}>
                <Text style={[styles.weatherLabel, { color: textColor }]}>
                  ❄️ 雪の時
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.numberInput,
                      { color: textColor, borderColor: textColor },
                    ]}
                    value={String(weatherSettings.snowMinutes)}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setWeatherSettings({
                        ...weatherSettings,
                        snowMinutes: num,
                      });
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={[styles.unitText, { color: textColor }]}>
                    分早める
                  </Text>
                </View>
              </View>

              {/* 雷雨の設定 */}
              <View style={styles.weatherInputRow}>
                <Text style={[styles.weatherLabel, { color: textColor }]}>
                  ⛈️ 雷雨の時
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.numberInput,
                      { color: textColor, borderColor: textColor },
                    ]}
                    value={String(weatherSettings.thunderstormMinutes)}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setWeatherSettings({
                        ...weatherSettings,
                        thunderstormMinutes: num,
                      });
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={[styles.unitText, { color: textColor }]}>
                    分早める
                  </Text>
                </View>
              </View>

              {/* 曇りの設定 */}
              <View style={styles.weatherInputRow}>
                <Text style={[styles.weatherLabel, { color: textColor }]}>
                  ☁️ 曇りの時
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.numberInput,
                      { color: textColor, borderColor: textColor },
                    ]}
                    value={String(weatherSettings.cloudyMinutes)}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setWeatherSettings({
                        ...weatherSettings,
                        cloudyMinutes: num,
                      });
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={[styles.unitText, { color: textColor }]}>
                    分早める
                  </Text>
                </View>
              </View>

              {/* 保存ボタン */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => saveWeatherSettings(weatherSettings)}
              >
                <Text style={styles.saveButtonText}>💾 設定を保存</Text>
              </TouchableOpacity>
            </>
          )}
        </ShadowView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 60, // iOSで縮める
  },
  section: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  userInfoRow: {
    marginBottom: 8,
  },
  avatarRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#888",
  },
  avatarChange: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  buttonRow: {
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 14,
  },
  linkRow: {
    marginBottom: 12,
  },
  linkSub: {
    marginLeft: 16,
    fontSize: 12,
  },
  linkButton: {
    marginTop: 4,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  settingDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  weatherInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  weatherLabel: {
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    width: 60,
    textAlign: "center",
  },
  unitText: {
    fontSize: 14,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
