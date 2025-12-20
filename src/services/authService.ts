// src/services/authService.ts
// 認証サービス - ログイン、ログアウト、ユーザー登録など

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoginRequest, SignupRequest, User, UserClass } from "../types/user";

const STORAGE_KEYS = {
  USERS: "@users",
  CURRENT_USER: "@current_user",
};

/**
 * 初期管理者アカウントを作成
 */
const createDefaultAdmin = (): User => ({
  id: "admin-001",
  username: "admin",
  password: "admin123", // 本番環境ではハッシュ化すべき
  email: "admin@example.com",
  userClass: UserClass.ADMIN,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  displayName: "管理者",
});

/**
 * 全ユーザーを取得
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (!usersJson) {
      // 初回起動時は管理者アカウントを作成
      const defaultAdmin = createDefaultAdmin();
      await AsyncStorage.setItem(
        STORAGE_KEYS.USERS,
        JSON.stringify([defaultAdmin])
      );
      return [defaultAdmin];
    }
    return JSON.parse(usersJson);
  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return [];
  }
}

/**
 * ユーザーを保存
 */
export async function saveUsers(users: User[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error("ユーザー保存エラー:", error);
    throw error;
  }
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userJson) {
      return null;
    }
    return JSON.parse(userJson);
  } catch (error) {
    console.error("現在のユーザー取得エラー:", error);
    return null;
  }
}

/**
 * 現在のユーザーを保存
 */
export async function setCurrentUser(user: User | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (error) {
    console.error("現在のユーザー保存エラー:", error);
    throw error;
  }
}

/**
 * ログイン処理
 */
export async function login(request: LoginRequest): Promise<User | null> {
  try {
    const users = await getAllUsers();
    const user = users.find(
      (u) =>
        u.username === request.username && u.password === request.password
    );

    if (user) {
      await setCurrentUser(user);
      return user;
    }

    return null;
  } catch (error) {
    console.error("ログインエラー:", error);
    throw error;
  }
}

/**
 * ログアウト処理
 */
export async function logout(): Promise<void> {
  try {
    await setCurrentUser(null);
  } catch (error) {
    console.error("ログアウトエラー:", error);
    throw error;
  }
}

/**
 * サインアップ処理
 */
export async function signup(request: SignupRequest): Promise<User | null> {
  try {
    const users = await getAllUsers();

    // ユーザー名の重複チェック
    if (users.some((u) => u.username === request.username)) {
      throw new Error("このユーザー名は既に使用されています");
    }

    // メールアドレスの重複チェック
    if (users.some((u) => u.email === request.email)) {
      throw new Error("このメールアドレスは既に使用されています");
    }

    // 新規ユーザーを作成
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: request.username,
      password: request.password,
      email: request.email,
      userClass: UserClass.USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: request.displayName,
    };

    // ユーザーを追加
    users.push(newUser);
    await saveUsers(users);

    // 自動ログイン
    await setCurrentUser(newUser);

    return newUser;
  } catch (error) {
    console.error("サインアップエラー:", error);
    throw error;
  }
}

/**
 * ユーザー情報を更新
 */
export async function updateUser(updatedUser: User): Promise<void> {
  try {
    const users = await getAllUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);

    if (index === -1) {
      throw new Error("ユーザーが見つかりません");
    }

    updatedUser.updatedAt = new Date().toISOString();
    users[index] = updatedUser;

    await saveUsers(users);

    // 現在のユーザーを更新している場合は、現在のユーザーも更新
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
      await setCurrentUser(updatedUser);
    }
  } catch (error) {
    console.error("ユーザー更新エラー:", error);
    throw error;
  }
}

/**
 * パスワードを変更
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  try {
    const users = await getAllUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      throw new Error("ユーザーが見つかりません");
    }

    if (user.password !== oldPassword) {
      throw new Error("現在のパスワードが正しくありません");
    }

    user.password = newPassword;
    user.updatedAt = new Date().toISOString();

    await saveUsers(users);

    // 現在のユーザーを更新
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      await setCurrentUser(user);
    }
  } catch (error) {
    console.error("パスワード変更エラー:", error);
    throw error;
  }
}

/**
 * 認証状態をチェック
 */
export async function checkAuthStatus(): Promise<boolean> {
  const currentUser = await getCurrentUser();
  return currentUser !== null;
}
