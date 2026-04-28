# Authentic Sources Policy

This app uses a hybrid data model.

## 1) Core Panchang

- Source: astronomical calculation using `panchang-ts`
- Mode: offline, on-device
- Scope: tithi, nakshatra, yoga, karana, sunrise/sunset, muhurta windows

## 2) Verified external events (optional)

The app can ingest a verified JSON feed (via environment variable):

- `EXPO_PUBLIC_VERIFIED_EVENTS_URL`

Use this for:

- Maharashtra Government public holiday list
- District administration event bulletins
- Temple trust published date circulars (with permission)

## 3) Copyright and scraping policy

- Do not scrape/copy proprietary calendar text or layouts.
- If a private publisher provides API/license, integrate only under explicit permission.
- Maintain source URL and publication reference per feed release.

## 4) Recommended source hierarchy

1. Official Government notifications / circulars (highest trust)
2. Temple trust or district administration notices
3. App-computed Panchang engine
4. Community-derived events (clearly marked)

## 5) Feed format

See sample: `docs/VERIFIED_EVENTS_FEED_SAMPLE.json`
