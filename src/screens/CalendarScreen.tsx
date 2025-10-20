// src/screens/CalendarScreen.tsx
import React, { useContext, useState } from 'react';
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

type ViewMode = 'day' | 'week' | 'month';

export default function CalendarScreen() {
    const { theme } = useContext(ThemeContext);
    const bgColor = theme === 'light' ? '#fff' : '#333';
    const textColor = theme === 'light' ? '#000' : '#fff';

    const [mode, setMode] = useState<ViewMode>('week');
    const [googleLinked, setGoogleLinked] = useState(false);

    // Googleカレンダー連携ダミー
    const handleGoogleLink = async () => {
        // 本来はOAuth認証処理
        setGoogleLinked(true);
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
            <View style={styles.segmentContainer}>
                {(['day', 'week', 'month'] as ViewMode[]).map((m) => (
                    <TouchableOpacity
                        key={m}
                        onPress={() => setMode(m)}
                        style={[
                            styles.segmentButton,
                            mode === m && { backgroundColor: '#007aff' },
                        ]}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                { color: mode === m ? '#fff' : textColor },
                            ]}
                        >
                            {m === 'day' ? '日毎' : m === 'week' ? '週間' : '月間'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {mode === 'day' && <DayView textColor={textColor} bgColor={bgColor} />}
                {mode === 'week' && <WeekView textColor={textColor} bgColor={bgColor} />}
                {mode === 'month' && <MonthView textColor={textColor} bgColor={bgColor} />}
                {/* Googleカレンダー連携UI */}
                <View style={{ marginTop: 24, alignItems: 'center' }}>
                    <Text style={{ color: textColor, marginBottom: 8 }}>
                        Googleカレンダー連携: {googleLinked ? '連携済み' : '未連携'}
                    </Text>
                    {!googleLinked && (
                        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLink}>
                            <Text style={{ color: '#fff' }}>Googleカレンダーと連携する</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function DayView({ textColor, bgColor }: { textColor: string; bgColor: string }) {
    return (
        <>
            <ShadowView style={[styles.sectionHeader, { backgroundColor: '#000' }]}>
                <Text style={[styles.sectionHeaderText]}>2025年6月16日（月）</Text>
            </ShadowView>
            <ShadowView style={[styles.itemBox, { backgroundColor: bgColor }]}>
                <Text style={{ color: textColor }}>▶ 08:30 会社ミーティング</Text>
                <Text style={{ color: textColor }}>▶ 12:00 ランチ会</Text>
                <Text style={{ color: textColor }}>▶ 15:30 顧客訪問</Text>
            </ShadowView>
        </>
    );
}

function WeekView({ textColor, bgColor }: { textColor: string; bgColor: string }) {
    // ワイヤーフレームに合わせて具体化
    const weekData = [
        { day: '15(日)', events: [] },
        { day: '16(月)', events: [
            { time: '08:30', title: '会社ミーティング', highlight: true },
            { time: '12:00', title: 'ランチ会', highlight: true },
            { time: '15:30', title: '顧客訪問', highlight: true },
        ]},
        { day: '17(火)', events: [] },
        { day: '18(水)', events: [] },
        { day: '19(木)', events: [] },
        { day: '20(金)', events: [] },
        { day: '21(土)', events: [] },
    ];
    return (
        <>
            <ShadowView style={[styles.sectionHeader, { backgroundColor: '#000' }]}>
                <Text style={styles.sectionHeaderText}>2025年6月15日～21日</Text>
            </ShadowView>
            {weekData.map((d, i) => (
                <ShadowView key={d.day} style={[styles.weekRow, { backgroundColor: bgColor }]}>
                    <Text style={{ color: textColor, width: 60 }}>{d.day}</Text>
                    <View style={{ flex: 1 }}>
                        {d.events.length === 0 ? (
                            <Text style={{ color: textColor }}>----</Text>
                        ) : (
                            d.events.map((ev, idx) => (
                                <Text
                                    key={idx}
                                    style={{
                                        color: ev.highlight ? '#000' : textColor,
                                        backgroundColor: ev.highlight ? '#ff0' : undefined,
                                        paddingHorizontal: 2,
                                    }}
                                >
                                    {ev.time} {ev.title}
                                </Text>
                            ))
                        )}
                    </View>
                </ShadowView>
            ))}
        </>
    );
}

function MonthView({ textColor, bgColor }: { textColor: string; bgColor: string }) {
    // 予定数インジケータ例
    const days = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        events: (i + 1) === 16 ? 3 : (i + 1) === 17 ? 1 : 0,
        highlight: (i + 1) === 16,
    }));
    return (
        <>
            <ShadowView style={[styles.sectionHeader, { backgroundColor: '#000' }]}>
                <Text style={styles.sectionHeaderText}>2025年6月</Text>
            </ShadowView>
            <View style={styles.monthGrid}>
                {days.map(({ day, events, highlight }) => (
                    <View
                        key={day}
                        style={[
                            styles.monthCell,
                            { backgroundColor: bgColor },
                            highlight && { borderColor: '#ff0', borderWidth: 2 },
                        ]}
                    >
                        <Text style={{ color: textColor, fontWeight: highlight ? 'bold' : 'normal' }}>
                            {day}
                        </Text>
                        {events > 0 && (
                            <Text style={{ color: textColor, fontSize: 12 }}>
                                他{events}
                            </Text>
                        )}
                    </View>
                ))}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    screen: { flex: 1 },
    segmentContainer: {
        flexDirection: 'row',
        margin: 12,
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
    },
    segmentText: { fontSize: 14 },
    content: {
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'ios' ? 8 : 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 60, // iOSで縮める
    },
    sectionHeader: {
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    sectionHeaderText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    itemBox: {
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
    },
    weekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 6,
        marginBottom: 6,
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    monthCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.5,
        borderColor: '#888',
    },
    googleButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
});
