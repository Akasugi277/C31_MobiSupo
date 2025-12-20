// src/screens/AccountSettingsScreen.tsx
import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
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
import * as userManagementService from "../services/userManagementService";
import { User, UserClass } from "../types/user";

interface AccountSettingsScreenProps {
  navigation: any;
}

export default function AccountSettingsScreen({ navigation }: AccountSettingsScreenProps) {
  const { theme } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const textColor = theme === "light" ? "#000" : "#fff";
  const bgColor = theme === "light" ? "#fff" : "#333";
  const inputBg = theme === "light" ? "#f5f5f5" : "#444";
  const cardBg = theme === "light" ? "#f5f5f5" : "#444";

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setDisplayName(user.displayName);
      setEmail(user.email);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    // 試験用管理者アカウントは変更不可
    if (currentUser.username === "admin") {
      Alert.alert("エラー", "試験用管理者アカウントは変更できません");
      return;
    }

    if (!displayName || !email) {
      Alert.alert("エラー", "表示名とメールアドレスを入力してください");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("エラー", "有効なメールアドレスを入力してください");
      return;
    }

    try {
      const updatedUser: User = {
        ...currentUser,
        displayName,
        email,
      };

      await authService.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      Alert.alert("成功", "プロフィールを更新しました");
    } catch (error) {
      Alert.alert("エラー", "プロフィールの更新に失敗しました");
      console.error("プロフィール更新エラー:", error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    // 試験用管理者アカウントは変更不可
    if (currentUser.username === "admin") {
      Alert.alert("エラー", "試験用管理者アカウントのパスワードは変更できません");
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("エラー", "すべてのパスワード項目を入力してください");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("エラー", "新しいパスワードは6文字以上で入力してください");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("エラー", "新しいパスワードが一致しません");
      return;
    }

    try {
      await authService.changePassword(currentUser.id, oldPassword, newPassword);
      Alert.alert("成功", "パスワードを変更しました");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("エラー", error.message || "パスワードの変更に失敗しました");
      console.error("パスワード変更エラー:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          // App.tsxで認証状態が変更され、自動的にログイン画面に遷移します
        },
      },
    ]);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>
            読み込み中...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const userClassName = userManagementService.getUserClassName(currentUser.userClass);
  const isTestAdminAccount = currentUser.username === "admin";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>アカウント設定</Text>
          {isTestAdminAccount && (
            <Text style={[styles.warningText, { color: "#FF9500" }]}>
              ※ 試験用管理者アカウントは編集できません
            </Text>
          )}
        </View>

        {/* アカウント情報 */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            アカウント情報
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: textColor }]}>ユーザー名</Text>
            <Text style={[styles.value, { color: textColor }]}>
              {currentUser.username}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: textColor }]}>ユーザークラス</Text>
            <View
              style={[
                styles.badge,
                currentUser.userClass === UserClass.ADMIN
                  ? styles.adminBadge
                  : currentUser.userClass === UserClass.USER
                  ? styles.userBadge
                  : styles.guestBadge,
              ]}
            >
              <Text style={styles.badgeText}>{userClassName}</Text>
            </View>
          </View>
        </View>

        {/* プロフィール編集 */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            プロフィール編集
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="表示名"
            placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
            value={displayName}
            onChangeText={setDisplayName}
            editable={!isTestAdminAccount}
          />
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="メールアドレス"
            placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isTestAdminAccount}
          />
          <TouchableOpacity 
            style={[
              styles.updateButton,
              isTestAdminAccount && styles.disabledButton
            ]} 
            onPress={handleUpdateProfile}
            disabled={isTestAdminAccount}
          >
            <Text style={styles.buttonText}>更新</Text>
          </TouchableOpacity>
        </View>

        {/* パスワード変更 */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            パスワード変更
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="現在のパスワード"
            placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isTestAdminAccount}
          />
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="新しいパスワード (6文字以上)"
            placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isTestAdminAccount}
          />
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="新しいパスワード (確認)"
            placeholderTextColor={theme === "light" ? "#999" : "#aaa"}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isTestAdminAccount}
          />
          <TouchableOpacity
            style={[
              styles.changePasswordButton,
              isTestAdminAccount && styles.disabledButton
            ]}
            onPress={handleChangePassword}
            disabled={isTestAdminAccount}
          >
            <Text style={styles.buttonText}>パスワード変更</Text>
          </TouchableOpacity>
        </View>

        {/* ログアウト */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  warningText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500",
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: "#FF3B30",
  },
  userBadge: {
    backgroundColor: "#007AFF",
  },
  guestBadge: {
    backgroundColor: "#8E8E93",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#007AFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  changePasswordButton: {
    backgroundColor: "#FF9500",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#8E8E93",
    opacity: 0.5,
  },
});
