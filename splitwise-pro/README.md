# Splitwise-style Android app

Independent React + Vite + Capacitor app. It preserves the existing Attendance app. Expense data is currently stored on-device in localStorage; cross-device accounts, invitations, push notifications, receipt OCR and payment-provider integrations require a configured backend/services before production release.

## Build
```sh
cd splitwise-pro
npm install
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```
