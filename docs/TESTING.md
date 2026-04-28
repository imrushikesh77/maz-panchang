# Testing Guide

This project is optimized for Android budget devices and Marathi UI correctness.

## 1) Pre-check

1. Install dependencies:
   - `npm install`
2. Type-check:
   - `npm run typecheck`

## 2) Run the app

- Android emulator/device:
  - `npm run android`

- Phone with Expo Go: run `npm start`, then scan the QR from Expo Go app.

If no emulator is running, start one from Android Studio Device Manager, then rerun the command.

### Important: Expo Go limitation

`expo-notifications` is limited in Expo Go (SDK 53+). For full notification testing, use a development build.

Development build commands:

1. `npx expo login`
2. `npx eas build --profile preview --platform android`
3. Install generated APK on device
4. Start Metro for dev-client:
   - `npx expo start --dev-client`

## 3) Core functional test cases

### A. Today screen (`आज`)

- Verify the top date hero uses a large Marathi date and weekday label when browsing away from today.
- Swipe right to move to the next date and swipe left to move to the previous date.
- Tap the `आज` button to jump back to the current date when viewing another day.
- Verify these fields are shown:
  - `तिथी`, `वार`, `नक्षत्र`, `योग`, `करण`
  - `सूर्योदय`, `सूर्यास्त`
  - `राहुकाल`, `गुलिककाल`, `यमगंड`, `अभिजीत मुहूर्त`
- Verify district label matches selected district.
- Pull to refresh and ensure data reloads without crash.

### B. Month screen (`महिना`)

- Confirm the month renders as a square printed-calendar style grid.
- Scroll entire month view and check smoothness.
- Confirm each day cell has tithi text and a visible festival/upwas marker.
- Confirm today and selected day have distinct visual emphasis.

### C. Festival screen (`सण`)

- Verify upcoming list appears.
- Confirm entries include upwas marker when applicable.
- Verify `जत्रा/यात्रा` filter displays community pilgrimage-style events.

### D. Settings screen (`सेटिंग्स`)

- Manually switch district and confirm data updates in other tabs.
- Tap auto-detect location button and grant permission.
- Confirm nearest district gets selected.
- Toggle large text mode and verify readability increase.

## 4) Notification tests

1. Enable notification toggles in settings.
2. Keep app open once so schedules are created.
3. Confirm no error on scheduling.
4. Verify reminders:
   - ~7:00 AM daily summary
   - ~7:00 PM tomorrow special reminder (when event exists)

Note: Local notifications depend on device battery settings and OEM background restrictions.

## 5) Offline-year behavior

Current app enforces offline year **2026**.

Test checks:

- For a 2026 date: Panchang loads.
- For date outside 2026: user sees proper limitation message.
- App should not crash while scheduling notifications when date is outside offline year.

## 6) Low-end device checklist (2 GB RAM target)

- Cold start under normal conditions.
- No UI freeze while switching tabs repeatedly.
- Day swipes and month navigation feel immediate, with no blank screen between transitions.
- Month list scroll remains responsive.
- Memory pressure does not crash app during 10-minute exploratory usage.

## 7) Release sanity checks

- `npm run typecheck` passes
- App opens with Marathi content across all tabs
- Notification permission request flow works
- Location permission denial flow shows fallback guidance
