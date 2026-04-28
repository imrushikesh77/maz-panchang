# Android Release Checklist

## A. Product Readiness

- [ ] Verify Marathi copy for all visible labels and messages.
- [ ] Validate top festival dates against trusted references for current year.
- [ ] Check district coordinates and spelling.

## B. Device Testing (Budget Phone Priority)

- [ ] Android 8, 9, 10, 11 on real devices/emulators.
- [ ] 2 GB RAM device: cold start, tab switch, month list scroll.
- [ ] Notification delivery at 7:00 AM / 7:00 PM.

## C. App Quality

- [ ] No crash in offline mode.
- [ ] Low network dependency for core daily data.
- [ ] Font readability in sunlight and low-brightness conditions.

## D. Legal & Compliance

- [ ] No copyrighted copied layout/content from other calendar publishers.
- [ ] Privacy Policy published and linked in Play Console.
- [ ] Data safety form filled accurately.

## E. Build and Submit

- [ ] `npm install`
- [ ] `npx tsc --noEmit`
- [ ] `eas build --platform android --profile production`
- [ ] Upload AAB to Play Console internal testing
- [ ] Run pre-launch report and fix blockers
- [ ] Promote to production

## F. Post-Release

- [ ] Track crashes/ANR
- [ ] Review user feedback in Marathi
- [ ] Plan yearly offline update pack
