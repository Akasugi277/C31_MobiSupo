// src/screens/HomeScreen.tsx
import React, { useContext } from 'react';
import {
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

export default function HomeScreen() {
    const { theme } = useContext(ThemeContext);
    const textColor = theme === 'light' ? '#000' : '#fff';
    const bgColor = theme === 'light' ? '#fff' : '#333';

    // ダミー予定データ
    const today = [
        {
            time: '08:30',
            title: '会社ミーティング（JR京都駅）',
            detail: '徒歩 → 電車（15分）',
            badge: 'あと13分で出発',
            badgeColor: '🟡',
        },
        {
            time: '12:00',
            title: 'ランチ会（烏丸御池）',
            detail: '徒歩（7分）',
            badge: '遅延あり：地下鉄烏丸線運転見合わせ',
            badgeColor: '🔴',
        },
        {
            time: '15:30',
            title: '顧客訪問（阪急大阪梅田駅）',
            detail: '電車＋徒歩（40分）',
            badge: '出発まで2時間',
            badgeColor: '🟢',
        },
    ];
    const tomorrow = [
        {
            time: '09:00',
            title: '定例会議（オンライン）',
            detail: '自宅',
            badge: '通知予定：8:45',
            badgeColor: '🟢',
        },
    ];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* 現在地＋天気ヘッダー */}
                <ShadowView style={[styles.header, { backgroundColor: bgColor }]}>
                    <Text style={[styles.headerText, { color: textColor }]}>
                        現在地: 京都府下京区 | 🌡 33.4°C（くもりのち晴れ）
                    </Text>
                </ShadowView>
                {/* 出発カウントダウン */}
                <ShadowView style={[styles.countdownBox, { backgroundColor: bgColor }]}>
                    <Text style={[styles.countdownLabel, { color: textColor }]}>
                        次の出発まで: <Text style={styles.countdownTime}>13分</Text>
                    </Text>
                    <TouchableOpacity style={styles.departButton}>
                        <Text style={styles.departButtonText}>今すぐ出発</Text>
                    </TouchableOpacity>
                </ShadowView>
                {/* 今日の予定 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>
                            本日 6月16日（月）
                        </Text>
                    </View>
                    {today.map((item, idx) => (
                        <ShadowView key={idx} style={[styles.itemBox, { backgroundColor: bgColor }]}>
                            <Text style={[styles.itemTime, { color: textColor }]}
                            >
                                ▶ {item.time} {item.title}
                            </Text>
                            <Text style={[styles.itemDetail, { color: textColor }]}>
                                └ {item.detail}
                            </Text>
                            <Text style={[styles.itemBadge, { color: textColor }]}>
                                └ [{item.badge}] {item.badgeColor}
                            </Text>
                        </ShadowView>
                    ))}
                </View>
                {/* 明日の予定 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>
                            明日 6月17日（火）の予定
                        </Text>
                    </View>
                    {tomorrow.map((item, idx) => (
                        <ShadowView key={idx} style={[styles.itemBox, { backgroundColor: bgColor }]}>
                            <Text style={[styles.itemTime, { color: textColor }]}
                            >
                                ▶ {item.time} {item.title}
                            </Text>
                            <Text style={[styles.itemDetail, { color: textColor }]}>
                                └ {item.detail}
                            </Text>
                            <Text style={[styles.itemBadge, { color: textColor }]}>
                                └ [{item.badge}] {item.badgeColor}
                            </Text>
                        </ShadowView>
                    ))}
                    <TouchableOpacity style={styles.moreButton}>
                        <Text style={{ color: textColor }}>もっと見る</Text>
                    </TouchableOpacity>
                </View>
                {/* サマリー */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>
                            サマリー
                        </Text>
                    </View>
                    <ShadowView style={[styles.summaryBox, { backgroundColor: bgColor }]}>
                        <Text style={[styles.summaryText, { color: textColor }]}
                        >
                            今日の予定：3件
                        </Text>
                        <Text style={[styles.summaryText, { color: textColor }]}
                        >
                            リスケ提案：1件（ランチ会）
                        </Text>
                    </ShadowView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    screen: { flex: 1 },
    scroll: {
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'ios' ? 8 : 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 60, // iOSで縮める
    },
    header: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    headerText: {
        fontSize: 14,
    },
    countdownBox: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    countdownLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    countdownTime: {
        fontWeight: 'bold',
    },
    departButton: {
        backgroundColor: '#007aff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    departButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        backgroundColor: '#000',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    sectionHeaderText: {
        color: '#fff',
        fontSize: 14,
    },
    itemBox: {
        padding: 10,
        borderRadius: 6,
        marginBottom: 8,
    },
    itemTime: {
        fontSize: 14,
        fontWeight: '500',
    },
    itemDetail: {
        fontSize: 13,
        marginLeft: 8,
    },
    itemBadge: {
        fontSize: 13,
        marginLeft: 8,
        marginTop: 4,
    },
    summaryBox: {
        padding: 10,
        borderRadius: 6,
    },
    summaryText: {
        fontSize: 14,
        marginBottom: 4,
    },
    moreButton: {
        alignSelf: 'flex-end',
        padding: 6,
    },
});
