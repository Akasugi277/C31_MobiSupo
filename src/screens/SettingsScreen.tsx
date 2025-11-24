// src/screens/SettingsScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleCalendarAuth from '../components/GoogleCalendarAuth';
import ShadowView from '../components/ShadowView';
import { ThemeContext } from '../components/ThemeContext';
import {
    clearGoogleCalendarToken,
    isGoogleCalendarAuthenticated,
    saveGoogleCalendarToken,
} from '../services/storageService';

export default function SettingsScreen() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const textColor = theme === 'light' ? 'rgb(33,33,33)' : 'rgb(224,224,224)';
    const bgColor = theme === 'light' ? '#fff' : '#333';

    // ユーザー情報編集
    const [name, setName] = useState('Kanamu Kato');
    const [intro, setIntro] = useState('ここに自己紹介を入力');
    const [email, setEmail] = useState('kanamu@example.com');
    const [editMode, setEditMode] = useState(false);

    // カレンダー連携状態
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [icloudLinked, setIcloudLinked] = useState(true);

    useEffect(() => {
        const check = async () => {
            const ok = await isGoogleCalendarAuthenticated();
            setIsAuthenticated(ok);
        };
        void check();
    }, []);

    const handleAuthSuccess = async (accessToken: string) => {
        await saveGoogleCalendarToken(accessToken);
        setIsAuthenticated(true);
        setShowAuthModal(false);
    };

    const handleDisconnectCalendar = () => {
        Alert.alert('Google Calendar連携解除', 'Google Calendarとの連携を解除しますか？', [
            { text: 'キャンセル', style: 'cancel' },
            {
                text: '解除する',
                style: 'destructive',
                onPress: async () => {
                    await clearGoogleCalendarToken();
                    setIsAuthenticated(false);
                },
            },
        ]);
    };

    const handleIcloudToggle = () => setIcloudLinked(v => !v);

    const handleSave = () => {
        // 実際はAPI送信など
        setEditMode(false);
    };

    const handleCancel = () => {
        // 元に戻す
        setName('Kanamu Kato');
        setIntro('ここに自己紹介を入力');
        setEmail('kanamu@example.com');
        setEditMode(false);
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
            <ScrollView
                style={[styles.screen, { backgroundColor: bgColor }]}
                contentContainerStyle={styles.container}
            >
                {/* ユーザー情報表示＆編集 */}
                <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
                    <View style={styles.avatarRow}>
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
                            style={styles.avatarPlaceholder}
                        />
                        {!editMode && (
                            <TouchableOpacity style={styles.avatarChange} onPress={() => setEditMode(true)}>
                                <Text style={{ color: textColor }}>編集</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {!editMode && (
                        <>
                            <Text style={[styles.label, { color: textColor }]}>名前：{name}</Text>
                            <Text style={[styles.label, { color: textColor }]}>紹介：{intro}</Text>
                            <Text style={[styles.label, { color: textColor }]}>Email：{email}</Text>
                        </>
                    )}

                    {editMode && (
                        <View style={{ gap: 8 }}>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="名前"
                                placeholderTextColor="#888"
                                style={[styles.input, { color: textColor, borderColor: textColor }]}
                            />
                            <TextInput
                                value={intro}
                                onChangeText={setIntro}
                                placeholder="紹介"
                                placeholderTextColor="#888"
                                style={[styles.input, { color: textColor, borderColor: textColor }]}
                            />
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                keyboardType="email-address"
                                placeholderTextColor="#888"
                                style={[styles.input, { color: textColor, borderColor: textColor }]}
                            />
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                <TouchableOpacity onPress={handleSave}>
                                    <Text style={{ color: '#0a84ff' }}>保存</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCancel}>
                                    <Text style={{ color: '#ff3b30' }}>キャンセル</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ShadowView>

                {/* カレンダー連携 */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>カレンダー連携</Text>
                <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
                    <View style={styles.linkRow}>
                        <Text style={{ color: icloudLinked ? 'green' : 'red' }}>
                            iCloud：{icloudLinked ? '連携済み' : '未連携'}
                        </Text>
                        <TouchableOpacity style={styles.linkButton} onPress={handleIcloudToggle}>
                            <Text style={{ color: '#0a84ff' }}>
                                {icloudLinked ? '解除する' : '連携する'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.linkRow}>
                        <Text style={{ color: isAuthenticated ? 'green' : 'red' }}>
                            Google：{isAuthenticated ? '連携済み' : '未連携'}
                        </Text>
                        {!isAuthenticated ? (
                            <TouchableOpacity style={styles.linkButton} onPress={() => setShowAuthModal(true)}>
                                <Text style={{ color: '#4285F4' }}>連携する</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.linkButton} onPress={handleDisconnectCalendar}>
                                <Text style={{ color: '#EA4335' }}>解除する</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ShadowView>

                {/* テーマ変更 */}
                <Text style={[styles.sectionTitle, { color: textColor }]}>テーマ</Text>
                <ShadowView style={[styles.section, { backgroundColor: bgColor }]}>
                    <TouchableOpacity style={styles.buttonRow} onPress={toggleTheme}>
                        <Text style={[styles.buttonText, { color: textColor }]}>
                            {theme === 'light' ? '🌙 ダークモードに切替' : '☀️ ライトモードに切替'}
                        </Text>
                    </TouchableOpacity>
                </ShadowView>
            </ScrollView>

            {/* Google Calendar認証モーダル */}
            <Modal
                visible={showAuthModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAuthModal(false)}
            >
                <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
                        <Text style={{ color: textColor, fontSize: 18, fontWeight: 'bold' }}>Google Calendar連携</Text>
                        <TouchableOpacity onPress={() => setShowAuthModal(false)}>
                            <Text style={{ color: '#007aff', fontSize: 16 }}>閉じる</Text>
                        </TouchableOpacity>
                    </View>
                    <GoogleCalendarAuth onAuthSuccess={handleAuthSuccess} />
                </SafeAreaView>
            </Modal>
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
        paddingBottom: Platform.OS === 'ios' ? 40 : 60,
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
    linkButton: {
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: Platform.OS === 'ios' ? 6 : 4,
        fontSize: 14,
    },
});
