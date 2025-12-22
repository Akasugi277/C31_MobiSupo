// src/screens/LoginScreen.tsx
import React, { useContext, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../components/ThemeContext";
import * as authService from "../services/authService";

interface LoginScreenProps {
  navigation: any;
  onLoginSuccess: () => void;
}

export default function LoginScreen({ navigation, onLoginSuccess }: LoginScreenProps) {
  const { theme } = useContext(ThemeContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const textColor = theme === "light" ? "#000" : "#fff";
  const bgColor = theme === "light" ? "#fff" : "#333";
  const inputBg = theme === "light" ? "#f5f5f5" : "#444";

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("エラー", "ユーザー名とパスワードを入力してください");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login({ username, password });
      
      if (user) {
        Alert.alert("ログイン成功", `ようこそ、${user.displayName}さん`);
        onLoginSuccess();
      } else {
        Alert.alert("ログイン失敗", "ユーザー名またはパスワードが正しくありません");
      }
    } catch (error) {
      Alert.alert("エラー", "ログインに失敗しました");
      console.error("ログインエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigation.navigate("Signup");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>MobiSupo</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            モバイルサポートアプリ
          </Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
              placeholder="ユーザー名"
              placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
              placeholder="パスワード"
              placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>ログイン</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signupButton]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: "#007AFF" }]}>
                アカウントを作成
              </Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: textColor }]}>
                デフォルト管理者アカウント:
              </Text>
              <Text style={[styles.infoText, { color: textColor, fontSize: 12 }]}>
                ユーザー名: admin
              </Text>
              <Text style={[styles.infoText, { color: textColor, fontSize: 12 }]}>
                パスワード: admin123
              </Text>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
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
  loginButton: {
    backgroundColor: "#007AFF",
  },
  signupButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    borderRadius: 8,
  },
  infoText: {
    textAlign: "center",
    marginBottom: 4,
  },
});
