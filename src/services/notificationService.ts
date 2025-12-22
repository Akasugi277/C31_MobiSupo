// notificationService.ts
// プッシュ通知を管理するサービス

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

// 通知の設定（この設定はapp.tsxに移動したので削除可能）
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

/**
 * プッシュ通知の権限を取得
 */
export async function registerForPushNotifications(): Promise<string | undefined> {
  if (!Device.isDevice) {
    console.warn("物理デバイスでのみ通知を受信できます");
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    throw new Error("プッシュ通知の許可が必要です");
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * 出発時刻の通知をスケジュール
 */
export async function scheduleDepartureNotification(
  departureTime: Date,
  destination: string,
  travelMode: string
): Promise<string> {
  try {
    // 現在時刻との差を計算
    const now = new Date();
    const secondsUntilDeparture = Math.floor(
      (departureTime.getTime() - now.getTime()) / 1000
    );

    // 過去の時刻の場合はエラー
    if (secondsUntilDeparture <= 0) {
      throw new Error("出発時刻が過去です");
    }

    // 通知をスケジュール
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚀 出発時刻です！",
        body: `${destination}へ向けて出発してください（${travelMode}）`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: secondsUntilDeparture,
      },
    });

    return notificationId;
  } catch (error) {
    console.error("通知のスケジュールに失敗:", error);
    throw error;
  }
}

/**
 * 準備時間の通知をスケジュール（出発時刻の前に通知）
 */
export async function schedulePreparationNotification(
  preparationTime: Date,
  destination: string,
  minutesBeforeDeparture: number,
  weatherMessage?: string
): Promise<string> {
  try {
    const now = new Date();
    const secondsUntilPreparation = Math.floor(
      (preparationTime.getTime() - now.getTime()) / 1000
    );

    console.log("📢 [notificationService] 通知スケジュール開始");
    console.log("  現在時刻:", now.toISOString());
    console.log("  通知時刻:", preparationTime.toISOString());
    console.log("  目的地:", destination);
    console.log("  出発まで:", minutesBeforeDeparture, "分");
    console.log("  天気情報:", weatherMessage || "なし");
    console.log("  通知までの秒数:", secondsUntilPreparation, "秒");

    if (secondsUntilPreparation <= 0) {
      console.error("❌ 準備時刻が過去です:", secondsUntilPreparation, "秒");
      throw new Error("準備時刻が過去です");
    }

    console.log("⏰ 通知を", secondsUntilPreparation, "秒後にスケジュールします");
    console.log("⏰ 絶対時刻:", preparationTime.toISOString());

    // 通知メッセージを構築
    let notificationBody = `${minutesBeforeDeparture}分後に${destination}へ出発です`;
    if (weatherMessage) {
      notificationBody += `\n${weatherMessage}`;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ 準備を始めましょう",
        body: notificationBody,
        sound: true,
        data: {
          scheduledFor: preparationTime.toISOString(),
          destination: destination,
          weather: weatherMessage,
        },
      },
      trigger: {
        // 相対時刻（秒数）ではなく、絶対時刻を使用
        type: 'date',
        date: preparationTime.getTime(),
      } as any,
    });

    console.log("✅ 通知スケジュール完了。ID:", notificationId);

    return notificationId;
  } catch (error) {
    console.error("❌ 準備通知のスケジュールに失敗:", error);
    throw error;
  }
}

/**
 * 天気に応じた通知をスケジュール
 */
export async function scheduleWeatherNotification(
  notificationTime: Date,
  weatherMessage: string
): Promise<string> {
  try {
    const now = new Date();
    const secondsUntil = Math.floor(
      (notificationTime.getTime() - now.getTime()) / 1000
    );

    if (secondsUntil <= 0) {
      throw new Error("通知時刻が過去です");
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌤️ 天気のお知らせ",
        body: weatherMessage,
        sound: true,
      },
      trigger: {
        seconds: secondsUntil,
      },
    });

    return notificationId;
  } catch (error) {
    console.error("天気通知のスケジュールに失敗:", error);
    throw error;
  }
}

/**
 * 予定に関する全ての通知をスケジュール
 */
export async function scheduleEventNotifications(params: {
  eventTitle: string;
  destination: string;
  departureTime: Date;
  preparationTime: Date;
  travelMode: string;
  weatherMessage?: string;
}): Promise<{
  departureNotificationId: string;
  preparationNotificationId: string;
  weatherNotificationId?: string;
}> {
  const {
    eventTitle,
    destination,
    departureTime,
    preparationTime,
    travelMode,
    weatherMessage
  } = params;

  // 出発通知
  const departureNotificationId = await scheduleDepartureNotification(
    departureTime,
    destination,
    travelMode
  );

  // 準備通知（出発の15分前など）
  const minutesBeforeDeparture = Math.floor(
    (departureTime.getTime() - preparationTime.getTime()) / (1000 * 60)
  );
  const preparationNotificationId = await schedulePreparationNotification(
    preparationTime,
    destination,
    minutesBeforeDeparture
  );

  // 天気通知（オプション）
  let weatherNotificationId: string | undefined;
  if (weatherMessage) {
    const weatherNotifTime = new Date(preparationTime.getTime() - 30 * 60 * 1000); // 準備の30分前
    weatherNotificationId = await scheduleWeatherNotification(
      weatherNotifTime,
      weatherMessage
    );
  }

  return {
    departureNotificationId,
    preparationNotificationId,
    weatherNotificationId,
  };
}

/**
 * 通知をキャンセル
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    console.log("🗑️ 通知削除:", notificationId);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log("✅ 通知削除完了:", notificationId);
  } catch (error) {
    console.error("❌ 通知削除エラー:", notificationId, error);
    throw error;
  }
}

/**
 * 全ての通知をキャンセル
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log("🗑️ 全通知削除開始:", notifications.length, "件");
    
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // 削除確認
    const remainingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log("✅ 全通知削除完了。残り:", remainingNotifications.length, "件");
    
    if (remainingNotifications.length > 0) {
      console.warn("⚠️ 削除されなかった通知:", remainingNotifications);
    }
  } catch (error) {
    console.error("❌ 全通知削除エラー:", error);
    throw error;
  }
}

/**
 * スケジュール済みの通知一覧を取得
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
