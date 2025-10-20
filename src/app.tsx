import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ThemeContext, ThemeProvider } from './components/ThemeContext';
import TabNavigator from './navigation/TabNavigator';

export default function App() {
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
