// src/screens/SignupScreen.tsx
import React, { useContext, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../components/ThemeContext";
import * as authService from "../services/authService";

interface SignupScreenProps {
  navigation: any;
  onSignupSuccess: () => void;
}

export default function SignupScreen({ navigation, onSignupSuccess }: SignupScreenProps) {
  const { theme } = useContext(ThemeContext);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const textColor = theme === "light" ? "#000" : "#fff";
  const bgColor = theme === "light" ? "#fff" : "#333";
  const inputBg = theme === "light" ? "#f5f5f5" : "#444";

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    // 入力チェック
    if (!username || !email || !displayName || !password || !confirmPassword) {
      Alert.alert("エラー", "すべての項目を入力してください");
      return;
    }

    if (username.length < 3) {
      Alert.alert("エラー", "ユーザー名は3文字以上で入力してください");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("エラー", "有効なメールアドレスを入力してください");
      return;
    }

    if (password.length < 6) {
      Alert.alert("エラー", "パスワードは6文字以上で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("エラー", "パスワードが一致しません");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.signup({
        username,
        email,
        displayName,
        password,
      });

      if (user) {
        Alert.alert("登録成功", `${user.displayName}さん、ようこそ！`);
        onSignupSuccess();
      }
    } catch (error: any) {
      Alert.alert("エラー", error.message || "アカウント作成に失敗しました");
      console.error("サインアップエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: textColor }]}>アカウント作成</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              新しいアカウントを登録します
            </Text>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder="ユーザー名 (3文字以上)"
                placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder="メールアドレス"
                placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder="表示名"
                placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
                value={displayName}
                onChangeText={setDisplayName}
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder="パスワード (6文字以上)"
                placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder="パスワード確認"
                placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.button, styles.signupButton]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>登録</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={handleBack}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: "#007AFF" }]}>
                  ログイン画面に戻る
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.7,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  signupButton: {
    backgroundColor: "#007AFF",
    marginTop: 10,
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
