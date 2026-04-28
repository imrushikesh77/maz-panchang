import { getDailyPanchang, type DailyPanchangResult, type FestivalInfo } from 'panchang-ts';
import type { CalendarDaySummary, MarathiDistrict, PanchangBundle } from '../types';
import { toDateKey } from '../utils/date';
import { isUpwasText, normalizeMarathi } from '../utils/marathi';
import { getVerifiedEventsForDate } from './verifiedEventsService';

const YEAR_LIMIT = 2026;
const timezone = 'Asia/Kolkata';

const cache = new Map<string, PanchangBundle>();
const monthCache = new Map<string, CalendarDaySummary[]>();

type DetailMode = 'full' | 'lite';

const marathiFestivals = (festivals: FestivalInfo[]) => festivals.map((item) => normalizeMarathi(item.name));

const toUpwasItems = (items: string[]) => items.filter(isUpwasText);

const getModeKey = (date: Date, district: MarathiDistrict, mode: DetailMode) =>
    `${toDateKey(date)}::${district.id}::${mode}`;

const getMonthKey = (date: Date, district: MarathiDistrict) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}::${district.id}`;

const unique = (items: string[]) => Array.from(new Set(items));
const yieldToUI = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const assertOfflineYear = (date: Date) => {
    if (date.getFullYear() !== YEAR_LIMIT) {
        throw new Error(`सध्या ऑफलाइन माहिती फक्त ${YEAR_LIMIT} वर्षासाठी उपलब्ध आहे.`);
    }
};

export const isDateInOfflineYear = (date: Date) => date.getFullYear() === YEAR_LIMIT;

export const getPanchangForDate = async (
    date: Date,
    district: MarathiDistrict,
    mode: DetailMode = 'full'
): Promise<PanchangBundle> => {
    assertOfflineYear(date);
    const key = getModeKey(date, district, mode);
    const fromCache = cache.get(key);

    if (fromCache) {
        return fromCache;
    }

    const result = getDailyPanchang(
        date,
        {
            latitude: district.latitude,
            longitude: district.longitude
        },
        {
            timezone,
            language: 'hi',
            region: 'maharashtra',
            masaSystem: 'purnimanta',
            precision: mode === 'full' ? 'high' : 'standard',
            computeEndTimes: mode === 'full'
        }
    );

    if (!result) {
        throw new Error('पंचांग गणना करण्यात अडचण आली. कृपया दुसरे ठिकाण निवडा.');
    }

    const dateKey = toDateKey(date);
    const festivals = marathiFestivals(result.festivals);
    const verifiedEvents = await getVerifiedEventsForDate(dateKey, district);
    const mergedFestivals = unique([...festivals, ...verifiedEvents]);

    const bundle: PanchangBundle = {
        dateKey,
        data: result,
        marathiFestivals: mergedFestivals,
        upwasItems: toUpwasItems(mergedFestivals)
    };

    cache.set(key, bundle);
    return bundle;
};

export const getMonthSummary = async (
    referenceDate: Date,
    district: MarathiDistrict
): Promise<CalendarDaySummary[]> => {
    const monthKey = getMonthKey(referenceDate, district);
    const fromCache = monthCache.get(monthKey);
    if (fromCache) {
        return fromCache;
    }

    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    if (year !== YEAR_LIMIT) {
        return [];
    }

    const lastDay = new Date(year, month + 1, 0).getDate();
    const rows: CalendarDaySummary[] = [];

    for (let day = 1; day <= lastDay; day += 1) {
        const date = new Date(year, month, day);
        const bundle = await getPanchangForDate(date, district, 'lite');

        rows.push({
            dateKey: toDateKey(date),
            dayNumber: day,
            tithi: normalizeMarathi(bundle.data.tithis[0]?.name ?? '—'),
            festivals: bundle.marathiFestivals,
            hasUpwas: bundle.upwasItems.length > 0
        });

        if (day % 5 === 0) {
            await yieldToUI();
        }
    }

    monthCache.set(monthKey, rows);
    return rows;
};

export const prewarmMonthSummary = async (referenceDate: Date, district: MarathiDistrict) => {
    try {
        await getMonthSummary(referenceDate, district);
    } catch {
        // ignore prewarm failures
    }
};

const getImportantLabels = (panchang: DailyPanchangResult) => {
    const labels: string[] = [];

    panchang.festivals.forEach((festival) => {
        labels.push(normalizeMarathi(festival.name));
    });

    if (labels.length === 0) {
        labels.push(normalizeMarathi(panchang.tithis[0]?.name ?? 'महत्वाचे नाही'));
    }

    return labels;
};

export const getNotificationText = async (date: Date, district: MarathiDistrict) => {
    const bundle = await getPanchangForDate(date, district, 'lite');
    const items = getImportantLabels(bundle.data);
    return items.slice(0, 3).join(', ');
};

export const getOfflineYear = () => YEAR_LIMIT;
