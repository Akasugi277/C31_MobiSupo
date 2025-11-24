# MobiSupo (モビサポ)

移動をサポートするスケジュール管理アプリ

## 概要

MobiSupoは、Googleカレンダーと連携し、予定への移動時間を自動計算してスケジュール管理をサポートするReact Native (Expo)アプリです。

## 主な機能

- ✅ Google Calendar連携（一方向同期）
- ✅ 現在地の天気情報表示
- ✅ 今日・明日の予定表示
- ✅ ルート検索（Google Maps API + 駅すぱあとAPI）
- ✅ スワイプで更新機能
- 🚧 移動時間の自動計算（開発中）
- 🚧 予定追加・編集機能（予定）

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

`.env.example`を`.env`にコピーして、各APIキーを設定してください。

```bash
cp .env.example .env
```

`.env`ファイルを開いて、以下のAPIキーを設定：

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

### 4. 必要なAPIキーの取得方法

#### OpenWeatherMap API
1. https://openweathermap.org/api にアクセス
2. アカウント作成
3. API Keyを取得

#### Google Maps API
1. https://console.cloud.google.com/ にアクセス
2. プロジェクト作成
3. 「Maps JavaScript API」と「Directions API」を有効化
4. 認証情報からAPI Keyを作成

#### 駅すぱあとAPI
1. https://api-info.ekispert.com/form/free/ にアクセス
2. 無料版に登録
3. API Keyを取得

#### Google Calendar API
1. https://console.cloud.google.com/ にアクセス
2. 「Google Calendar API」を有効化
3. OAuth 2.0クライアントID（ウェブアプリケーション）を作成
4. 承認済みリダイレクトURIに`http://localhost`を追加
5. Client IDとClient Secretを取得

### 5. アプリを起動

```bash
npx expo start
```

Expo Goアプリでスキャンするか、エミュレーター/シミュレーターで起動してください。

## 技術スタック

- **フレームワーク**: React Native (Expo)
- **言語**: TypeScript
- **状態管理**: React Hooks
- **ストレージ**: AsyncStorage
- **API**:
  - Google Calendar API
  - Google Maps API
  - OpenWeatherMap API
  - 駅すぱあとAPI

## ディレクトリ構造

```
src/
├── components/         # UIコンポーネント
│   ├── AddEventModal.tsx
│   ├── EventDetailModal.tsx
│   ├── GoogleCalendarAuth.tsx
│   ├── ShadowView.tsx
│   ├── TabIcons.tsx
│   └── ThemeContext.tsx
├── navigation/        # ナビゲーション
│   └── TabNavigator.tsx
├── screens/           # 画面コンポーネント
│   ├── CalendarScreen.tsx
│   ├── HomeScreen.tsx
│   └── SettingsScreen.tsx
├── services/          # APIサービス
│   ├── calendarService.ts
│   ├── holidayService.ts
│   ├── notificationService.ts
│   ├── routeService.ts
│   ├── storageService.ts
│   └── weatherService.ts
├── utils/             # 共通ユーティリティ
│   └── Logger.ts
└── config.ts          # 設定ファイル
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

**重要**: `.env`ファイルは絶対にGitHubにコミットしないでください。

`.gitignore`に`.env`が含まれていることを確認してください。


## 注意事項

- 開発段階のアプリです
- 現在(2025/11/10)Google Calendar認証は簡易版（手動でコードをコピー＆ペースト）です
- App Storeへの公開は予定していません
