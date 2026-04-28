# Marathi Calendar App Investigation (0 → 100)

## 1. User Research Focus (Rural Maharashtra)

Priority use-cases:

1. आजची तिथी, वार, उपवास
2. उद्याचा सण/उपवास
3. मुहूर्त वेळा (राहुकाल, अभिजीत)
4. साधा मासिक view

## 2. Feature Benchmark vs common physical calendars

Must-have blocks captured:

- पंचांग core: तिथी, वार, नक्षत्र, योग, करण
- दिनविशेष: सण, व्रत, उपवास
- वेळा: सूर्योदय, सूर्यास्त, राहुकाल, गुलिककाल, यमगंड, अभिजीत
- महाराष्ट्र-केंद्रित regional festivals (via region filter)

## 3. Correctness Strategy

Absolute 100% claim needs governance. Current robust strategy:

- Calculation engine: `panchang-ts` (offline TS engine)
- high precision mode
- district coordinates
- timezone fixed to Asia/Kolkata
- pre-release sampling validation checklist

Validation checklist:

- Gudi Padwa
- Ram Navami
- Ashadhi Ekadashi
- Nag Panchami
- Ganesh Chaturthi
- Navratri start
- Dussehra
- Diwali
- Kartiki Ekadashi
- Makar Sankranti

## 4. Performance Strategy (2GB RAM phones)

- No heavy animation
- No remote dependency for core daily data
- `FlatList` for month/festival views
- in-memory per-day cache
- minimal image assets

## 5. Offline Policy

Current implementation:

- Offline available for 2026 only (as requested)

Roadmap:

- yearly downloadable packs (2027, 2028...)
- background update on Wi-Fi only

## 6. UX Rules Implemented

- मराठी-first labels
- Large text mode enabled by default
- Bottom tabs: आज | महिना | सण | सेटिंग्स
- single-screen essentials for quick lookup

## 7. Notification Design

- 7:00 AM: आजचा पंचांग
- 7:00 PM: उद्याचे विशेष (सण/उपवास असल्यास)

## 8. Legal & Publishing Safety

- No direct copy of Mahalaxmi/Kalnirnay layout or proprietary text
- Feature parity intent only
- Play Store listing should state independent calendar app

## 9. Play Store Plan

- Package: `com.mazapanchang.app`
- Build: EAS Android AAB
- Content rating: Everyone
- Data safety: minimal local storage settings only

## 10. Next Milestones

1. Expert panel verification workflow (pandit validation)
2. Multi-year offline packs
3. Voice readout Marathi TTS mode
4. Village event module (जत्रा/उत्सव)
5. Crash analytics + ANR monitoring
