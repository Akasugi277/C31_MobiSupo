// src/components/AdminToggleButton.tsx
// デバッグ用の管理者/一般ユーザー切り替えボタン
import React, { useEffect, useState } from "react";
import {
    Alert,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as authService from "../services/authService";
import { User, UserClass } from "../types/user";

interface AdminToggleButtonProps {
  onUserChanged?: () => void;
}

export default function AdminToggleButton({ onUserChanged }: AdminToggleButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const toggleUserClass = async () => {
    if (!currentUser) return;

    // 試験用管理者アカウント（admin）のみ切り替え可能
    if (currentUser.username !== "admin") {
      Alert.alert(
        "制限",
        "この機能は試験用管理者アカウント（admin）専用です。\n\n一般ユーザーや他の管理者は、ユーザークラスを自分で変更できません。"
      );
      return;
    }

    const newClass =
      currentUser.userClass === UserClass.ADMIN
        ? UserClass.USER
        : UserClass.ADMIN;

    Alert.alert(
      "ユーザークラス切り替え（デバッグ用）",
      `${
        newClass === UserClass.ADMIN ? "管理者" : "一般ユーザー"
      }に切り替えますか？\n\n※この機能は試験用です`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "切り替え",
          onPress: async () => {
            try {
              const updatedUser: User = {
                ...currentUser,
                userClass: newClass,
              };
              await authService.updateUser(updatedUser);
              setCurrentUser(updatedUser);
              Alert.alert(
                "切り替え完了",
                `${
                  newClass === UserClass.ADMIN ? "管理者" : "一般ユーザー"
                }に切り替えました`
              );
              if (onUserChanged) {
                onUserChanged();
              }
            } catch (error) {
              Alert.alert("エラー", "ユーザークラスの切り替えに失敗しました");
              console.error("ユーザークラス切り替えエラー:", error);
            }
          },
        },
      ]
    );
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.userClass === UserClass.ADMIN;

  return (
    <View style={styles.container}>
      {/* トグルボタン */}
      <TouchableOpacity
        style={[styles.toggleButton, isAdmin ? styles.adminButton : styles.userButton]}
        onPress={toggleVisibility}
      >
        <Text style={styles.toggleButtonText}>
          {isAdmin ? "👑" : "👤"}
        </Text>
      </TouchableOpacity>

      {/* 詳細パネル */}
      {isVisible && (
        <Animated.View
          style={[
            styles.panel,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.panelContent}>
            <Text style={styles.panelTitle}>デバッグモード</Text>
            <Text style={styles.panelText}>
              現在: {isAdmin ? "管理者" : "一般ユーザー"}
            </Text>
            <Text style={styles.panelSubtext}>
              ユーザー名: {currentUser.username}
            </Text>
            <TouchableOpacity
              style={[
                styles.switchButton,
                isAdmin ? styles.toUserButton : styles.toAdminButton,
              ]}
              onPress={toggleUserClass}
            >
              <Text style={styles.switchButtonText}>
                {isAdmin ? "一般ユーザーに切り替え" : "管理者に切り替え"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 9999,
  },
  toggleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  adminButton: {
    backgroundColor: "#FF3B30",
  },
  userButton: {
    backgroundColor: "#007AFF",
  },
  toggleButtonText: {
    fontSize: 24,
  },
  panel: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 250,
  },
  panelContent: {
    padding: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  panelText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#000",
  },
  panelSubtext: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  switchButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  toAdminButton: {
    backgroundColor: "#FF3B30",
  },
  toUserButton: {
    backgroundColor: "#007AFF",
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
