// src/services/userManagementService.ts
// ユーザー管理サービス（管理者専用）

import { User, UserClass } from "../types/user";
import * as authService from "./authService";

/**
 * 全ユーザーを取得（管理者専用）
 */
export async function listAllUsers(): Promise<User[]> {
  return await authService.getAllUsers();
}

/**
 * ユーザーを削除（管理者専用）
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const users = await authService.getAllUsers();
    
    // 管理者が最後の1人の場合は削除できない
    const adminUsers = users.filter((u) => u.userClass === UserClass.ADMIN);
    const userToDelete = users.find((u) => u.id === userId);
    
    if (userToDelete?.userClass === UserClass.ADMIN && adminUsers.length === 1) {
      throw new Error("最後の管理者は削除できません");
    }

    const filteredUsers = users.filter((u) => u.id !== userId);
    await authService.saveUsers(filteredUsers);
  } catch (error) {
    console.error("ユーザー削除エラー:", error);
    throw error;
  }
}

/**
 * ユーザークラスを変更（管理者専用）
 */
export async function changeUserClass(
  userId: string,
  newClass: UserClass
): Promise<void> {
  try {
    const users = await authService.getAllUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      throw new Error("ユーザーが見つかりません");
    }

    // 管理者が最後の1人の場合は降格できない
    if (user.userClass === UserClass.ADMIN && newClass !== UserClass.ADMIN) {
      const adminUsers = users.filter((u) => u.userClass === UserClass.ADMIN);
      if (adminUsers.length === 1) {
        throw new Error("最後の管理者は降格できません");
      }
    }

    user.userClass = newClass;
    await authService.updateUser(user);
  } catch (error) {
    console.error("ユーザークラス変更エラー:", error);
    throw error;
  }
}

/**
 * ユーザーのパスワードをリセット（管理者専用）
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  try {
    const users = await authService.getAllUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      throw new Error("ユーザーが見つかりません");
    }

    user.password = newPassword;
    user.updatedAt = new Date().toISOString();

    await authService.updateUser(user);
  } catch (error) {
    console.error("パスワードリセットエラー:", error);
    throw error;
  }
}

/**
 * ユーザークラスの表示名を取得
 */
export function getUserClassName(userClass: UserClass): string {
  switch (userClass) {
    case UserClass.ADMIN:
      return "管理者";
    case UserClass.USER:
      return "ユーザー";
    case UserClass.GUEST:
      return "未登録";
    default:
      return "不明";
  }
}
