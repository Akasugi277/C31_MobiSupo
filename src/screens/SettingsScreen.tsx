// src/screens/SettingsScreen.tsx
import React, { useContext, useState } from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShadowView from '../components/ShadowView';
import { ThemeContext } from '../components/ThemeContext';

export default function SettingsScreen() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const textColor = theme === 'light' ? '#000' : '#fff';
    const bgColor = theme === 'light' ? '#fff' : '#333';

    // ダミーユーザー
    const [googleLinked, setGoogleLinked] = useState(false);
    const [icloudLinked, setIcloudLinked] = useState(true);

    // Googleカレンダー連携ダミー
    const handleGoogleLink = async () => {
        // 本来はOAuth認証処理
        setGoogleLinked(true);
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
            <ScrollView
                style={[styles.screen, { backgroundColor: bgColor }]}
                contentContainerStyle={styles.container}
            >
                {/* プロフィール情報 */}
                <ShadowView style={[styles.section, { backgroundColor: bgColor }]}
                >
                    <View style={styles.avatarRow}>
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
                            style={styles.avatarPlaceholder}
                        />
                        <TouchableOpacity style={styles.avatarChange}>
                            <Text style={{ color: textColor }}>変更</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.label, { color: textColor }]}>
                        Kanamu Kato
                    </Text>
                    <Text style={[styles.label, { color: textColor }]}>
                        ここに自己紹介を入力
                    </Text>
                    <Text style={[styles.label, { color: textColor }]}>
                        ユーザー名：Kanamu Kato
                    </Text>
                    <Text style={[styles.label, { color: textColor }]}>
                        Email：kanamu@example.com
                    </Text>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            ▶ アカウント設定
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            ▶ Apple/Googleカレンダー連携
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            ▶ アプリの設定
                        </Text>
                    </TouchableOpacity>
                </ShadowView>

                {/* アカウント設定 */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                    アカウント設定
                </Text>
                <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            ユーザー名・ニックネーム変更する
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            メールアドレスを変更する
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            パスワードを変更する
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            アバターを変更する
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            アカウントを削除する
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            ログアウトする
                        </Text>
                    </TouchableOpacity>
                </ShadowView>

                {/* カレンダー連携 */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                    カレンダー連携
                </Text>
                <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
                    <View style={styles.linkRow}>
                        <Text style={{ color: icloudLinked ? 'green' : 'red' }}>
                            iCloudカレンダー：{icloudLinked ? '連携済み' : '未連携'}
                        </Text>
                        <Text style={[styles.linkSub, { color: textColor }]}>
                            kanamu@icloud.com
                        </Text>
                    </View>
                    <View style={styles.linkRow}>
                        <Text style={{ color: googleLinked ? 'green' : 'red' }}>
                            Googleカレンダー：{googleLinked ? '連携済み' : '未連携'}
                        </Text>
                        {!googleLinked && (
                            <TouchableOpacity style={styles.linkButton} onPress={handleGoogleLink}>
                                <Text style={{ color: '#4285F4' }}>連携する</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ShadowView>

                {/* アプリの設定 */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                    アプリの設定
                </Text>
                <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
                    <TouchableOpacity style={styles.buttonRow} onPress={toggleTheme}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            {theme === 'light' ? '🌙 ダークモードに切替' : '☀️ ライトモードに切替'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            API設定
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            通知設定
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            アクセス権限
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonRow}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            バージョン情報
                        </Text>
                    </TouchableOpacity>
                </ShadowView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    screen: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'ios' ? 8 : 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 60, // iOSで縮める
    },
    section: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    avatarRow: {
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#888',
    },
    avatarChange: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
    },
    buttonRow: {
        paddingVertical: 8,
    },
    buttonText: {
        fontSize: 14,
    },
    linkRow: {
        marginBottom: 12,
    },
    linkSub: {
        marginLeft: 16,
        fontSize: 12,
    },
    linkButton: {
        marginTop: 4,
    },
});
