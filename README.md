# Maza Panchang (माझं पंचांग)

Marathi-first Android Panchang app focused on rural Maharashtra users.

## Features in this version

- Full Marathi UI with large-text mode.
- Warm, traditional Marathi calendar design tuned for rural users.
- District-based Panchang for 35+ Maharashtra districts.
- Auto-select nearest district using device location.
- Daily Panchang details:
  - `तिथी` (Tithi), `वार` (Vara), `नक्षत्र` (Nakshatra), `योग` (Yoga), `करण` (Karana)
  - `सूर्योदय` (Sunrise), `सूर्यास्त` (Sunset)
  - `राहुकाल`, `गुलिककाल`, `यमगंड`, `अभिजीत मुहूर्त`
- `सण` / `उपवास` listing.
- `जत्रा / यात्रा` focused community-event view (rule-based for key pilgrimage days).
- Swipe on the `आज` screen to move to next/previous date instantly.
- Large date hero that changes from `आज` to the selected weekday when browsing other dates.
- Square, printed-calendar style month page with tap-to-open day detail sheet.
- Smart notifications:
  - 7:00 AM: Today's Panchang summary
  - 7:00 PM: Tomorrow special reminder (festival/fasting days)
- Optimized for budget phones (2 GB RAM target): lightweight UI, virtualized lists, caching, memoized screens, and faster tab switching.

## UX upgrades

- Traditional date hero for the `आज` page with large Marathi date treatment.
- Swipe navigation for previous/next day.
- Square month grid with printed-calendar feel.
- Weekend visual cues (Saturday/Sunday coloring)
- Per-day mini tithi marker in month cells
- Direct date tap opens full day detail view
- Adjacent-month prewarm cache for faster month switching
- District-specific jatra rule mapping layer
- New warm color palette and icon-led bottom tabs.
- New custom app logo and icon pack in `assets/`

## Tech stack

- Expo (React Native + TypeScript)
- `panchang-ts` (offline Panchang engine, pure TypeScript)
- `expo-notifications`
- `expo-location`
- `@react-native-async-storage/async-storage`

## Accuracy and reliability strategy

1. **Calculation precision**
   - `precision: high`, `timezone: Asia/Kolkata`, `region: maharashtra`
   - district-level latitude/longitude calculations

2. **Validation process before release**
   - cross-check major dates against trusted references
   - manual verification on key days (Ekadashi, Sankranti, major festivals)

3. **Rural UX constraints**
   - minimal navigation complexity
   - large readable text and low visual clutter
   - low-animation UI for smooth low-end performance

## Important current limitation

Offline support is currently enforced for **year 2026** only.

## Authentic source ingestion (optional)

You can merge verified external events into the app by setting:

- `EXPO_PUBLIC_VERIFIED_EVENTS_URL`

Feed schema sample is available in `docs/VERIFIED_EVENTS_FEED_SAMPLE.json`.

## Local development

1. Install dependencies
   - `npm install`
2. Start app on Android
   - `npm run android`

## How to test

See the full checklist in `docs/TESTING.md`.

Quick flow:

1. Type-check the app
   - `npm run typecheck`
2. Run on device/emulator
   - `npm run android`
   - or use Expo Go with `npm start`
3. Validate core screens
   - `आज` tab: large date hero, sunrise/sunset symbols, and swipe navigation work
   - `महिना` tab: square calendar grid renders smoothly and looks like a traditional wall calendar
   - `सण` tab: upcoming festivals/upwas list appears
   - `सेटिंग्स` tab: district switch + auto-detect works
4. Validate notification behavior
   - enable notification toggles
   - keep app opened once to schedule alerts
   - check morning/evening reminders

Note: Expo Go has limitations for `expo-notifications` (SDK 53+). Use a development build for complete notification testing.

## Play Store build (production)

1. Login
   - `npx expo login`
2. Install EAS CLI
   - `npm i -g eas-cli`
3. Configure EAS (first time)
   - `eas build:configure`
4. Build AAB
   - `eas build --platform android --profile production`
5. Submit
   - `eas submit --platform android --profile production`

## Publishing docs

- Play Store listing draft: `docs/PLAYSTORE_LISTING_EN.md`
- Privacy policy draft: `docs/PRIVACY_POLICY.md`
- Release checklist: `docs/RELEASE_CHECKLIST.md`
- Authentic sources policy: `docs/AUTHENTIC_SOURCES.md`
- UX inspiration notes: `docs/UX_INSPIRATION_NOTES.md`
