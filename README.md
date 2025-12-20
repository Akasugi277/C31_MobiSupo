# MobiSupo (モビサポ)

移動をサポートするスケジュール管理アプリ

## 概要

MobiSupo は、Google カレンダーと連携し、予定への移動時間を自動計算してスケジュール管理をサポートする React Native (Expo)アプリです。

## 主な機能

### スケジュール管理

- ✅ Google Calendar 連携（一方向同期）
- ✅ 今日・明日の予定表示
- ✅ 予定追加・編集・削除機能
- ✅ 移動時間の自動計算
- ✅ 天気連動通知機能
- ✅ ルート検索（Google Maps API + 駅すぱあと API）
- ✅ スワイプで更新機能

### ユーザー管理

- ✅ アカウント認証システム（ログイン/ログアウト）
- ✅ ユーザークラス管理（管理者/ユーザー/未登録）
- ✅ アカウント作成・編集機能
- ✅ プロフィール管理（表示名、メールアドレス）
- ✅ パスワード変更機能
- ✅ 管理者専用ユーザー管理画面
  - ユーザー一覧表示
  - ユーザークラスの変更
  - 新規ユーザー作成
  - パスワードリセット
  - ユーザー削除
- ✅ 試験用管理者アカウント保護機能

### その他

- ✅ 現在地の天気情報表示
- ✅ ダークモード対応
- ✅ 通知管理機能

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/あなたのユーザー名/MobiSupo.git
cd MobiSupo
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.example`を`.env`にコピーして、各 API キーを設定してください。

```bash
cp .env.example .env
```

`.env`ファイルを開いて、以下の API キーを設定：

```env
# OpenWeatherMap API Key
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# 駅すぱあと API Key
EXPO_PUBLIC_EKISPERT_API_KEY=your_key_here

# Google Calendar API - OAuth 2.0 Client
EXPO_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here
```

### 4. 必要な API キーの取得方法

#### OpenWeatherMap API

1. https://openweathermap.org/api にアクセス
2. アカウント作成
3. API Key を取得

#### Google Maps API

1. https://console.cloud.google.com/ にアクセス
2. プロジェクト作成
3. 「Maps JavaScript API」と「Directions API」を有効化
4. 認証情報から API Key を作成

#### 駅すぱあと API

1. https://api-info.ekispert.com/form/free/ にアクセス
2. 無料版に登録
3. API Key を取得

#### Google Calendar API

1. https://console.cloud.google.com/ にアクセス
2. 「Google Calendar API」を有効化
3. OAuth 2.0 クライアント ID（ウェブアプリケーション）を作成
4. 承認済みリダイレクト URI に`http://localhost`を追加
5. Client ID と Client Secret を取得

### 5. アプリを起動

```bash
npx expo start
```

Expo Go アプリでスキャンするか、エミュレーター/シミュレーターで起動してください。

### 6. デフォルトアカウント

アプリ初回起動時に、以下の試験用管理者アカウントが自動作成されます：

- **ユーザー名**: `admin`
- **パスワード**: `admin123`
- **ユーザークラス**: 管理者

このアカウントでログインすることで、全機能にアクセスできます。

**注意**: 試験用管理者アカウント（admin）は、セキュリティのため編集・削除ができないように保護されています。

## 技術スタック

- **フレームワーク**: React Native (Expo)
- **言語**: TypeScript
- **状態管理**: React Hooks
- **ナビゲーション**: React Navigation
- **ストレージ**: AsyncStorage
- **通知**: Expo Notifications
- **位置情報**: Expo Location
- **API**:
  - Google Calendar API
  - Google Maps API
  - OpenWeatherMap API
  - 駅すぱあと API

## ディレクトリ構造

```
src/
├── components/              # UIコンポーネント
│   ├── AddEventModal.tsx           # 予定追加モーダル
│   ├── EditEventModal.tsx          # 予定編集モーダル
│   ├── EventDetailModal.tsx        # 予定詳細モーダル
│   ├── GoogleCalendarAuth.tsx      # Googleカレンダー認証
│   ├── RouteMapModal.tsx           # ルートマップモーダル
│   ├── AdminToggleButton.tsx       # 管理者/ユーザー切替ボタン（デバッグ用）
│   ├── ShadowView.tsx              # 影付きビュー
│   ├── TabIcons.tsx                # タブアイコン
│   └── ThemeContext.tsx            # テーマ管理
├── screens/                 # 画面コンポーネント
│   ├── HomeScreen.tsx              # ホーム画面
│   ├── CalendarScreen.tsx          # カレンダー画面
│   ├── SettingsScreen.tsx          # 設定画面
│   ├── LoginScreen.tsx             # ログイン画面
│   ├── SignupScreen.tsx            # アカウント作成画面
│   ├── AccountSettingsScreen.tsx   # アカウント設定画面
│   └── UserManagementScreen.tsx    # ユーザー管理画面（管理者専用）
├── services/                # APIサービス・ビジネスロジック
│   ├── calendarService.ts          # カレンダーサービス
│   ├── weatherService.ts           # 天気情報サービス
│   ├── routeService.ts             # ルート検索サービス
│   ├── notificationService.ts      # 通知サービス
│   ├── storageService.ts           # ストレージサービス
│   ├── authService.ts              # 認証サービス
│   └── userManagementService.ts    # ユーザー管理サービス
├── navigation/              # ナビゲーション設定
│   └── TabNavigator.tsx            # タブナビゲーター
├── types/                   # 型定義
│   └── user.ts                     # ユーザー関連の型定義
├── utils/                   # ユーティリティ
│   └── Logger.ts                   # ログ管理
├── app.tsx                  # アプリのエントリーポイント
└── config.ts                # 設定ファイル
```

## 開発ガイド

### ブランチ運用

- `main`: 本番リリース用
- `develop`: 開発用メインブランチ
- `feature/xxx`: 新機能開発
- `fix/xxx`: バグ修正

### コミットメッセージ規約

- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド設定や依存関係の更新

## セキュリティ

**重要**: `.env`ファイルは絶対に GitHub にコミットしないでください。

`.gitignore`に`.env`が含まれていることを確認してください。

## ライセンス

このプロジェクトはプライベート開発用です。

## 作成者

- あなたの名前

## ユーザー管理機能

### ユーザークラス

アプリでは 3 つのユーザークラスが定義されています：

- **管理者（ADMIN）**: すべての機能にアクセス可能。ユーザー管理画面で他のユーザーを管理できます
- **一般ユーザー（USER）**: 通常のアプリ機能を使用できます
- **未登録（GUEST）**: 制限された機能のみ使用可能

### 認証フロー

1. 未ログイン状態では、ログイン画面が表示されます
2. 既存アカウントでログイン、または新規アカウントを作成
3. ログイン後、メイン画面にアクセス可能
4. 設定画面からアカウント設定やログアウトができます

### 管理者機能

管理者アカウントでログインすると、以下の機能が利用できます：

- **ユーザー管理画面**: 設定画面から「ユーザー管理（管理者専用）」リンクでアクセス
- **新規ユーザー作成**: 管理者が一般ユーザーを作成できます
- **ユーザークラス変更**: 一般ユーザーを管理者に昇格、または降格
- **パスワードリセット**: 他のユーザーのパスワードをリセット
- **ユーザー削除**: 不要なユーザーアカウントを削除

### データ保存

- すべてのユーザー情報は JSON フォーマットで AsyncStorage に保存されます
- パスワードは平文で保存されています（**本番環境では必ずハッシュ化してください**）
- 予定データもユーザーごとに保存されます

## セキュリティに関する注意

**重要**: このアプリは開発・学習用です。本番環境で使用する場合は、以下の対応が必要です：

- ⚠️ パスワードのハッシュ化（bcrypt など）
- ⚠️ トークンベースの認証（JWT）
- ⚠️ HTTPS 通信の強制
- ⚠️ サーバーサイドでのユーザー管理
- ⚠️ より強固な入力検証

## 注意事項

- 開発・学習段階のアプリです
- Google Calendar 認証は簡易版（手動でコードをコピー＆ペースト）です
- ユーザー管理はローカルストレージベースです（現時点では実運用には適していません）
- App Store への公開は予定していません
