// GoogleCalendarAuth.tsx
// Google Calendar認証コンポーネント（簡易版）

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import * as calendarService from "../services/calendarService";

interface GoogleCalendarAuthProps {
  onAuthSuccess: (accessToken: string) => void;
}

export default function GoogleCalendarAuth({
  onAuthSuccess,
}: GoogleCalendarAuthProps) {
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ステップ1: 認証URLを開く
  const handleOpenAuthUrl = () => {
    const authUrl = calendarService.getAuthUrl();
    Alert.alert(
      "Google認証",
      "ブラウザでGoogleアカウントにログインして許可してください。\n\nリダイレクトされたページのURLから、code=の後ろの部分をコピーして、このアプリに戻って入力してください。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "ブラウザを開く",
          onPress: () => {
            Linking.openURL(authUrl);
          },
        },
      ]
    );
  };

  // ステップ2: 認証コードを送信
  const handleSubmitCode = async () => {
    if (!authCode.trim()) {
      Alert.alert("エラー", "認証コードを入力してください");
      return;
    }

    setLoading(true);
    try {
      const accessToken = await calendarService.exchangeCodeForToken(
        authCode.trim()
      );
      Alert.alert("成功", "Googleカレンダーと連携しました");
      onAuthSuccess(accessToken);
    } catch (error) {
      console.error("認証エラー:", error);
      Alert.alert(
        "エラー",
        "認証に失敗しました。認証コードが正しいか確認してください。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Googleカレンダー連携</Text>

      <Text style={styles.instructions}>
        Googleカレンダーの予定を取得するには、認証が必要です。
      </Text>

      {/* ステップ1: 認証URLを開く */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleOpenAuthUrl}
      >
        <Text style={styles.buttonText}>
          ステップ1: Googleで認証
        </Text>
      </TouchableOpacity>

      {/* ステップ2: 認証コードを入力 */}
      <Text style={styles.stepTitle}>ステップ2: 認証コードを入力</Text>
      <TextInput
        style={styles.input}
        placeholder="認証コードをここに貼り付け"
        value={authCode}
        onChangeText={setAuthCode}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, styles.submitButton]}
        onPress={handleSubmitCode}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "認証中..." : "連携する"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#4285F4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: "#34A853",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
});
