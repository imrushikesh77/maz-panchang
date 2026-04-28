import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { AppSettings, MarathiDistrict } from '../types';
import { getNotificationText, getPanchangForDate, isDateInOfflineYear } from './panchangService';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true
        })
    });
}

const MORNING_HOUR = 7;
const EVENING_HOUR = 19;
const SCHEDULE_DAYS = 21;

const atHour = (date: Date, hour: number) => {
    const out = new Date(date);
    out.setHours(hour, 0, 0, 0);
    return out;
};

const hasSpecial = async (date: Date, district: MarathiDistrict, settings: AppSettings) => {
    const bundle = await getPanchangForDate(date, district, 'lite');

    if (settings.enableFestivalReminder && bundle.marathiFestivals.length > 0) {
        return true;
    }

    if (settings.enableUpwasReminder && bundle.upwasItems.length > 0) {
        return true;
    }

    return false;
};

const scheduleOne = async (date: Date, title: string, body: string) => {
    if (date.getTime() <= Date.now()) {
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date
        }
    });
};

export const requestNotificationPermission = async () => {
    if (isExpoGo) {
        return false;
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
        return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
};

export const setupNotificationChannel = async () => {
    if (Platform.OS !== 'android') {
        return;
    }

    await Notifications.setNotificationChannelAsync('daily-panchang', {
        name: 'Daily Panchang',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default'
    });
};

export const refreshScheduledNotifications = async (
    district: MarathiDistrict,
    settings: AppSettings
) => {
    if (isExpoGo) {
        return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const allowed = await requestNotificationPermission();
    if (!allowed) {
        return;
    }

    await setupNotificationChannel();

    const today = new Date();

    for (let offset = 0; offset < SCHEDULE_DAYS; offset += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() + offset);

        const tomorrow = new Date(date);
        tomorrow.setDate(date.getDate() + 1);

        if (!isDateInOfflineYear(date) || !isDateInOfflineYear(tomorrow)) {
            continue;
        }

        try {
            if (settings.enableDailySummary) {
                const summary = await getNotificationText(date, district);
                await scheduleOne(
                    atHour(date, MORNING_HOUR),
                    'आजचा पंचांग',
                    `आज महत्वाचे: ${summary}`
                );
            }

            const specialTomorrow = await hasSpecial(tomorrow, district, settings);
            if (specialTomorrow) {
                const text = await getNotificationText(tomorrow, district);
                await scheduleOne(
                    atHour(date, EVENING_HOUR),
                    'उद्या विशेष माहिती',
                    `उद्या: ${text}`
                );
            }
        } catch {
            // Skip invalid day without breaking the full scheduling loop.
        }
    }
};

export const notificationsSupportedInCurrentBuild = () => !isExpoGo;
