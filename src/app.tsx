import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ThemeContext, ThemeProvider } from './components/ThemeContext';
import TabNavigator from './navigation/TabNavigator';

// 通知ハンドラーの設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,  // 非推奨
    shouldShowBanner: true,  // バナー通知を表示
    shouldShowList: true,    // 通知リストに追加
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
    useEffect(() => {
        // 通知権限の取得
        const requestNotificationPermissions = async () => {
            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.warn('通知権限が許可されていません');
                    Alert.alert(
                        '通知権限',
                        'アプリの通知機能を使用するには、設定で通知を許可してください。',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                console.log('✅ 通知権限が許可されました');

                // Android用のチャンネル設定
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'デフォルト',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#FF231F7C',
                    });
                }
            } catch (error) {
                console.error('通知権限の取得に失敗:', error);
            }
        };

        requestNotificationPermissions();
    }, []);

    return (
        <ThemeProvider>
            <ThemeContext.Consumer>
                {({ navigationTheme }) => (
                    <NavigationContainer theme={navigationTheme}>
                        <TabNavigator />
                    </NavigationContainer>
                )}
            </ThemeContext.Consumer>
        </ThemeProvider>
    );
}
