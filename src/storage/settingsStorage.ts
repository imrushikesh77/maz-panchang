import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DISTRICT_ID } from '../constants/locations';
import type { AppSettings } from '../types';

const SETTINGS_KEY = 'marathi_calendar_settings_v1';

export const defaultSettings: AppSettings = {
    districtId: DEFAULT_DISTRICT_ID,
    largeTextMode: true,
    enableDailySummary: true,
    enableFestivalReminder: true,
    enableUpwasReminder: true
};

export const loadSettings = async (): Promise<AppSettings> => {
    try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return defaultSettings;
        }

        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return {
            ...defaultSettings,
            ...parsed
        };
    } catch {
        return defaultSettings;
    }
};

export const saveSettings = async (settings: AppSettings) => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
