import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import AdminToggleButton from './components/AdminToggleButton';
import { ThemeContext, ThemeProvider } from './components/ThemeContext';
import TabNavigator from './navigation/TabNavigator';
import AccountSettingsScreen from './screens/AccountSettingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import * as authService from './services/authService';

const Stack = createStackNavigator();

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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeApp();
        
        // 認証状態を定期的にチェック
        const intervalId = setInterval(async () => {
            const authStatus = await authService.checkAuthStatus();
            setIsAuthenticated(authStatus);
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const initializeApp = async () => {
        // 通知権限の取得
        await requestNotificationPermissions();
        
        // 認証状態のチェック
        const authStatus = await authService.checkAuthStatus();
        setIsAuthenticated(authStatus);
        setIsLoading(false);
    };

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

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    const handleUserChanged = async () => {
        // ユーザークラスが変更された時にリロード
        const authStatus = await authService.checkAuthStatus();
        setIsAuthenticated(authStatus);
    };

    if (isLoading) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
    }

    return (
        <ThemeProvider>
            <ThemeContext.Consumer>
                {({ navigationTheme }) => (
                    <NavigationContainer theme={navigationTheme}>
                        {isAuthenticated ? (
                            <>
                                <Stack.Navigator screenOptions={{ headerShown: true }}>
                                    <Stack.Screen
                                        name="Main"
                                        component={TabNavigator}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="AccountSettings"
                                        component={AccountSettingsScreen}
                                        options={{ title: 'アカウント設定' }}
                                    />
                                    <Stack.Screen
                                        name="UserManagement"
                                        component={UserManagementScreen}
                                        options={{ title: 'ユーザー管理' }}
                                    />
                                </Stack.Navigator>
                                {/* デバッグ用の切り替えボタン */}
                                <AdminToggleButton onUserChanged={handleUserChanged} />
                            </>
                        ) : (
                            <Stack.Navigator screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="Login">
                                    {(props) => (
                                        <LoginScreen
                                            {...props}
                                            onLoginSuccess={handleLoginSuccess}
                                        />
                                    )}
                                </Stack.Screen>
                                <Stack.Screen name="Signup">
                                    {(props) => (
                                        <SignupScreen
                                            {...props}
                                            onSignupSuccess={handleLoginSuccess}
                                        />
                                    )}
                                </Stack.Screen>
                            </Stack.Navigator>
                        )}
                    </NavigationContainer>
                )}
            </ThemeContext.Consumer>
        </ThemeProvider>
    );
}
