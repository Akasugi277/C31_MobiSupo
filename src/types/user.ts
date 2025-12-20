// src/types/user.ts
// ユーザー管理に関する型定義

/**
 * ユーザークラス
 * - ADMIN (0): 管理者
 * - USER (1): 一般ユーザー
 * - GUEST (2): 未登録ユーザー
 */
export enum UserClass {
  ADMIN = 0,
  USER = 1,
  GUEST = 2,
}

/**
 * ユーザー情報
 */
export interface User {
  id: string;
  username: string;
  password: string; // 本番環境ではハッシュ化すべき
  email: string;
  userClass: UserClass;
  createdAt: string;
  updatedAt: string;
  displayName: string;
}

/**
 * 認証状態
 */
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * サインアップリクエスト
 */
export interface SignupRequest {
  username: string;
  password: string;
  email: string;
  displayName: string;
}
