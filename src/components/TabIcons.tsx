import React from 'react';
import { View } from 'react-native';

// SVG インポート（ファイル名を確認して調整）
// 例: home-light.svg, home-dark.svg など
import CalendarDarkSvg from '../../public/ui/calendar-dark.svg';
import CalendarLightSvg from '../../public/ui/calendar-light.svg';
import HomeDarkSvg from '../../public/ui/home-dark.svg';
import HomeLightSvg from '../../public/ui/home-light.svg';
import SettingDarkSvg from '../../public/ui/setting-dark.svg';
import SettingLightSvg from '../../public/ui/setting-light.svg';

type Props = { active: boolean; themeMode: 'light' | 'dark'; size?: number };

// 統一アイコンサイズ（必要ならここを調整）
const ICON_SIZE = 20;

function IconWrapper({ children, active, size = ICON_SIZE }: { children: React.ReactNode; active: boolean; size?: number }) {
    return (
        <View
            style={{
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: active ? 1 : 0.6,
            }}
            pointerEvents="none"
        >
            {children}
        </View>
    );
}

export function HomeIcon({ active, themeMode, size = ICON_SIZE }: Props) {
    const Icon = themeMode === 'light' ? HomeLightSvg : HomeDarkSvg;
    return (
        <IconWrapper active={active} size={size}>
            <Icon width={size} height={size} />
        </IconWrapper>
    );
}

export function CalendarIcon({ active, themeMode, size = ICON_SIZE }: Props) {
    const Icon = themeMode === 'light' ? CalendarLightSvg : CalendarDarkSvg;
    return (
        <IconWrapper active={active} size={size}>
            <Icon width={size} height={size} />
        </IconWrapper>
    );
}

export function SettingsIcon({ active, themeMode, size = ICON_SIZE }: Props) {
    const Icon = themeMode === 'light' ? SettingLightSvg : SettingDarkSvg;
    return (
        <IconWrapper active={active} size={size}>
            <Icon width={size} height={size} />
        </IconWrapper>
    );
}
