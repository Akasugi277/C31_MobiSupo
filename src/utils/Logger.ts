// src/utils/Logger.ts
import * as FileSystem from 'expo-file-system';

// Expo FileSystem の documentDirectory は FileSystem.Directory
const LOG_FILE = FileSystem.getDocumentDirectoryAsync
    ? (await FileSystem.getDocumentDirectoryAsync()) + 'navigation.log'
    : FileSystem.documentDirectory + 'navigation.log';

/**
 * メッセージをタイムスタンプ付きでファイルに追記します
 */
export async function log(message: string) {
    const time = new Date().toISOString();
    const line = `${time} ${message}\n`;
    try {
        // 既存ファイル内容を取得して追記
        let prev = '';
        try {
            prev = await FileSystem.readAsStringAsync(LOG_FILE);
        } catch (e) {
            // ファイルがなければ空
            prev = '';
        }
        await FileSystem.writeAsStringAsync(LOG_FILE, prev + line, {
            encoding: FileSystem.Encoding.UTF8,
        });
    } catch (e) {
        console.error('Logging failed', e);
    }
}
