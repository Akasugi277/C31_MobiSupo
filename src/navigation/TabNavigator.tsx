import { BottomTabBar, BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarIcon, HomeIcon, SettingsIcon } from '../components/TabIcons';
import { ThemeContext } from '../components/ThemeContext';
import CalendarScreen from '../screens/CalendarScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function CustomTabBar(props: BottomTabBarProps) {
    // const { theme, toggleTheme } = useContext(ThemeContext); // ←不要
    return (
        <View style={styles.wrapper}>
            <BottomTabBar {...props} />
            {/* ライト/ダーク切り替えボタンを削除 */}
        </View>
    );
}

export default function TabNavigator() {
    const { theme } = useContext(ThemeContext);
    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={props => <CustomTabBar {...props} />}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'ホーム',
                    tabBarIcon: ({ focused }) => <HomeIcon active={focused} themeMode={theme} />,
                }}
            />
            <Tab.Screen
                name="Calendar"
                component={CalendarScreen}
                options={{
                    tabBarLabel: 'カレンダー',
                    tabBarIcon: ({ focused }) => <CalendarIcon active={focused} themeMode={theme} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: '設定',
                    tabBarIcon: ({ focused }) => <SettingsIcon active={focused} themeMode={theme} />,
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'column',
    },
    button: {
        alignSelf: 'center',
        padding: 8,
        marginTop: 4,
    },
    buttonText: {
        fontSize: 14,
    },
});
