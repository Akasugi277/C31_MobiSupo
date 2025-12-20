// src/screens/UserManagementScreen.tsx
import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../components/ThemeContext";
import * as authService from "../services/authService";
import * as userManagementService from "../services/userManagementService";
import { User, UserClass } from "../types/user";

interface UserManagementScreenProps {
  navigation: any;
}

export default function UserManagementScreen({ navigation }: UserManagementScreenProps) {
  const { theme } = useContext(ThemeContext);
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const textColor = theme === "light" ? "#000" : "#fff";
  const bgColor = theme === "light" ? "#fff" : "#333";
  const cardBg = theme === "light" ? "#f5f5f5" : "#444";

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadUsers = async () => {
    try {
      const allUsers = await userManagementService.listAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("ユーザー読み込みエラー:", error);
      Alert.alert("エラー", "ユーザー情報の読み込みに失敗しました");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleCreateUser = () => {
    Alert.prompt(
      "新規ユーザー作成",
      "ユーザー名を入力してください",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "次へ",
          onPress: (username?: string) => {
            if (!username || username.trim().length < 3) {
              Alert.alert("エラー", "ユーザー名は3文字以上で入力してください");
              return;
            }
            // 次にメールアドレスを入力
            Alert.prompt(
              "新規ユーザー作成",
              "メールアドレスを入力してください",
              [
                { text: "キャンセル", style: "cancel" },
                {
                  text: "次へ",
                  onPress: (email?: string) => {
                    if (!email || !email.includes("@")) {
                      Alert.alert("エラー", "有効なメールアドレスを入力してください");
                      return;
                    }
                    // 次に表示名を入力
                    Alert.prompt(
                      "新規ユーザー作成",
                      "表示名を入力してください",
                      [
                        { text: "キャンセル", style: "cancel" },
                        {
                          text: "次へ",
                          onPress: (displayName?: string) => {
                            if (!displayName || displayName.trim().length === 0) {
                              Alert.alert("エラー", "表示名を入力してください");
                              return;
                            }
                            // 最後にパスワードを入力
                            Alert.prompt(
                              "新規ユーザー作成",
                              "初期パスワードを入力してください（6文字以上）",
                              [
                                { text: "キャンセル", style: "cancel" },
                                {
                                  text: "作成",
                                  onPress: async (password?: string) => {
                                    if (!password || password.length < 6) {
                                      Alert.alert("エラー", "パスワードは6文字以上で入力してください");
                                      return;
                                    }
                                    try {
                                      const newUser = await authService.signup({
                                        username: username!.trim(),
                                        email: email!.trim(),
                                        displayName: displayName!.trim(),
                                        password: password,
                                      });
                                      
                                      // 作成したユーザーは一般ユーザー（USER）として作成される
                                      // 必要に応じて管理者が後からクラスを変更できる
                                      
                                      Alert.alert(
                                        "成功",
                                        `ユーザー "${displayName}" を作成しました\n\nユーザー名: ${username}\nメール: ${email}\n初期パスワード: ${password}\n\n※ユーザーにログイン情報を伝えてください`
                                      );
                                      
                                      // 現在ログインしているユーザーを復元
                                      if (currentUser) {
                                        await authService.setCurrentUser(currentUser);
                                      }
                                      
                                      loadUsers();
                                    } catch (error: any) {
                                      Alert.alert("エラー", error.message || "ユーザーの作成に失敗しました");
                                    }
                                  },
                                },
                              ],
                              "secure-text"
                            );
                          },
                        },
                      ],
                      "plain-text"
                    );
                  },
                },
              ],
              "plain-text"
            );
          },
        },
      ],
      "plain-text"
    );
  };

  const handleDeleteUser = (user: User) => {
    // 試験用管理者アカウントは削除不可
    if (user.username === "admin") {
      Alert.alert("エラー", "試験用管理者アカウントは削除できません");
      return;
    }

    Alert.alert(
      "ユーザー削除",
      `${user.displayName} (${user.username}) を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await userManagementService.deleteUser(user.id);
              Alert.alert("成功", "ユーザーを削除しました");
              loadUsers();
            } catch (error: any) {
              Alert.alert("エラー", error.message || "ユーザーの削除に失敗しました");
            }
          },
        },
      ]
    );
  };

  const handleChangeUserClass = (user: User) => {
    // 試験用管理者アカウントは変更不可
    if (user.username === "admin") {
      Alert.alert("エラー", "試験用管理者アカウントのクラスは変更できません");
      return;
    }

    const options = [
      { label: "管理者", value: UserClass.ADMIN },
      { label: "ユーザー", value: UserClass.USER },
      { label: "未登録", value: UserClass.GUEST },
    ];

    Alert.alert(
      "ユーザークラス変更",
      `${user.displayName} (${user.username}) のクラスを変更します`,
      [
        ...options.map((option) => ({
          text: option.label,
          onPress: async () => {
            try {
              await userManagementService.changeUserClass(user.id, option.value);
              Alert.alert("成功", `ユーザークラスを${option.label}に変更しました`);
              loadUsers();
            } catch (error: any) {
              Alert.alert("エラー", error.message || "ユーザークラスの変更に失敗しました");
            }
          },
        })),
        { text: "キャンセル", style: "cancel" },
      ]
    );
  };

  const handleResetPassword = (user: User) => {
    Alert.prompt(
      "パスワードリセット",
      `${user.displayName} (${user.username}) の新しいパスワードを入力してください`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "リセット",
          onPress: async (newPassword?: string) => {
            if (!newPassword || newPassword.length < 6) {
              Alert.alert("エラー", "パスワードは6文字以上で入力してください");
              return;
            }

            try {
              await userManagementService.resetUserPassword(user.id, newPassword);
              Alert.alert("成功", "パスワードをリセットしました");
            } catch (error: any) {
              Alert.alert("エラー", error.message || "パスワードのリセットに失敗しました");
            }
          },
        },
      ],
      "secure-text"
    );
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isCurrentUser = currentUser?.id === item.id;
    const isTestAdminAccount = item.username === "admin";
    const userClassName = userManagementService.getUserClassName(item.userClass);

    return (
      <View style={[styles.userCard, { backgroundColor: cardBg }]}>
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, { color: textColor }]}>
            {item.displayName}
            {isCurrentUser && <Text style={styles.currentUserBadge}> (あなた)</Text>}
            {isTestAdminAccount && (
              <Text style={[styles.currentUserBadge, { color: "#FF9500" }]}> (試験用)</Text>
            )}
          </Text>
          <Text style={[styles.username, { color: textColor }]}>
            @{item.username}
          </Text>
          <Text style={[styles.email, { color: textColor }]}>{item.email}</Text>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.badge,
                item.userClass === UserClass.ADMIN
                  ? styles.adminBadge
                  : item.userClass === UserClass.USER
                  ? styles.userBadge
                  : styles.guestBadge,
              ]}
            >
              <Text style={styles.badgeText}>{userClassName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.classButton,
              isTestAdminAccount && styles.disabledButton
            ]}
            onPress={() => handleChangeUserClass(item)}
            disabled={isTestAdminAccount}
          >
            <Text style={styles.actionButtonText}>クラス変更</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.resetButton,
              isTestAdminAccount && styles.disabledButton
            ]}
            onPress={() => handleResetPassword(item)}
            disabled={isTestAdminAccount}
          >
            <Text style={styles.actionButtonText}>パスワード</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.deleteButton,
              isTestAdminAccount && styles.disabledButton
            ]}
            onPress={() => handleDeleteUser(item)}
            disabled={isTestAdminAccount}
          >
            <Text style={styles.actionButtonText}>削除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>ユーザー管理</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              登録ユーザー: {users.length}名
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateUser}
          >
            <Text style={styles.createButtonText}>➕ ユーザー作成</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  list: {
    padding: 16,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 12,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  currentUserBadge: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "normal",
  },
  username: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    marginTop: 4,
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
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  classButton: {
    backgroundColor: "#007AFF",
  },
  resetButton: {
    backgroundColor: "#FF9500",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#8E8E93",
    opacity: 0.5,
  },
});
