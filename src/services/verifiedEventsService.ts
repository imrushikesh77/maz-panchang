import type { MarathiDistrict } from '../types';
import { normalizeMarathi } from '../utils/marathi';

type VerifiedEvent = {
    date: string;
    titleMr: string;
    type: 'gov-holiday' | 'local-fair' | 'temple-event';
    districts?: string[];
};

type VerifiedFeed = {
    version: string;
    source: string;
    events: VerifiedEvent[];
};

const FEED_URL = process.env.EXPO_PUBLIC_VERIFIED_EVENTS_URL;

let feedPromise: Promise<VerifiedFeed | null> | null = null;

const isValidFeed = (value: unknown): value is VerifiedFeed => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const feed = value as Partial<VerifiedFeed>;
    return typeof feed.version === 'string' && typeof feed.source === 'string' && Array.isArray(feed.events);
};

const loadFeed = async (): Promise<VerifiedFeed | null> => {
    if (!FEED_URL) {
        return null;
    }

    if (!feedPromise) {
        feedPromise = (async () => {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 6000);

                const res = await fetch(FEED_URL, { signal: controller.signal });
                clearTimeout(timer);

                if (!res.ok) {
                    return null;
                }

                const json = (await res.json()) as unknown;
                if (!isValidFeed(json)) {
                    return null;
                }

                return json;
            } catch {
                return null;
            }
        })();
    }

    return feedPromise;
};

const matchesDistrict = (event: VerifiedEvent, district: MarathiDistrict) => {
    if (!event.districts || event.districts.length === 0) {
        return true;
    }

    return event.districts.includes('all') || event.districts.includes(district.id);
};

export const getVerifiedEventsForDate = async (dateKey: string, district: MarathiDistrict) => {
    const feed = await loadFeed();
    if (!feed) {
        return [] as string[];
    }

    return feed.events
        .filter((event) => event.date === dateKey && matchesDistrict(event, district))
        .map((event) => normalizeMarathi(event.titleMr));
};

export const getVerifiedFeedSource = async () => {
    const feed = await loadFeed();
    return feed?.source ?? null;
};
