import type { DailyPanchangResult } from 'panchang-ts';

export type MarathiDistrict = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
};

export type AppSettings = {
    districtId: string;
    largeTextMode: boolean;
    enableDailySummary: boolean;
    enableFestivalReminder: boolean;
    enableUpwasReminder: boolean;
};

export type CalendarDaySummary = {
    dateKey: string;
    dayNumber: number;
    tithi: string;
    festivals: string[];
    hasUpwas: boolean;
};

export type PanchangBundle = {
    dateKey: string;
    data: DailyPanchangResult;
    marathiFestivals: string[];
    upwasItems: string[];
};
