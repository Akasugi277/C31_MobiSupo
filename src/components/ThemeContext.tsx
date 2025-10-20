import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, Theme as NavigationTheme } from '@react-navigation/native';
import React, { createContext, ReactNode, useState } from 'react';

type ThemeType = 'light' | 'dark';

export const ThemeContext = createContext<{
    theme: ThemeType;
    toggleTheme: () => void;
    navigationTheme: NavigationTheme;
}>({
    theme: 'light',
    toggleTheme: () => {},
    navigationTheme: NavigationLightTheme,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeType>('light');
    const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
    const navigationTheme = theme === 'light' ? NavigationLightTheme : NavigationDarkTheme;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, navigationTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
